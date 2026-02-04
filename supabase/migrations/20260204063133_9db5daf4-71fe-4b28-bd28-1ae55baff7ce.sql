-- Drop ALL existing versions of the function first
DROP FUNCTION IF EXISTS public.rpc_transition_trainee_stage(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_transition_trainee_stage(UUID, trainee_workflow_stage, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_transition_trainee_stage;

-- Now create the new version
CREATE OR REPLACE FUNCTION public.rpc_transition_trainee_stage(
    p_trainee_id UUID,
    p_to_stage TEXT,
    p_sub_status TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stage TEXT;
    v_workflow_id UUID;
    v_transition RECORD;
    v_trainee RECORD;
    v_required_missing TEXT[];
BEGIN
    -- 1. Get current stage
    SELECT tw.id, tw.current_stage::TEXT INTO v_workflow_id, v_current_stage
    FROM trainee_workflow tw
    WHERE tw.trainee_id = p_trainee_id;
    
    IF v_workflow_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Không tìm thấy workflow cho học viên này');
    END IF;
    
    -- 2. Check if transition is allowed
    SELECT * INTO v_transition
    FROM master_stage_transitions
    WHERE from_stage = v_current_stage AND to_stage = p_to_stage;
    
    IF v_transition IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', format('Không thể chuyển từ "%s" sang "%s"', v_current_stage, p_to_stage),
            'current_stage', v_current_stage,
            'requested_stage', p_to_stage
        );
    END IF;
    
    -- 3. Check required fields
    IF v_transition.requires_fields IS NOT NULL THEN
        SELECT * INTO v_trainee FROM trainees WHERE id = p_trainee_id;
        
        SELECT array_agg(field) INTO v_required_missing
        FROM unnest(v_transition.requires_fields) AS field
        WHERE CASE field
            WHEN 'class_id' THEN v_trainee.class_id IS NULL
            WHEN 'receiving_company_id' THEN v_trainee.receiving_company_id IS NULL
            WHEN 'visa_date' THEN v_trainee.visa_date IS NULL
            WHEN 'coe_date' THEN v_trainee.coe_date IS NULL
            WHEN 'departure_date' THEN v_trainee.departure_date IS NULL
            WHEN 'entry_date' THEN v_trainee.entry_date IS NULL
            ELSE FALSE
        END;
        
        IF v_required_missing IS NOT NULL AND array_length(v_required_missing, 1) > 0 THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'Thiếu thông tin bắt buộc',
                'missing_fields', v_required_missing
            );
        END IF;
    END IF;
    
    -- 4. Validate terminated sub_status
    IF p_to_stage = 'terminated' AND p_sub_status IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM master_terminated_reasons WHERE reason_code = p_sub_status) THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', format('Lý do kết thúc không hợp lệ: %s', p_sub_status)
            );
        END IF;
    END IF;
    
    -- 5. Update workflow
    UPDATE trainee_workflow
    SET current_stage = p_to_stage::trainee_workflow_stage,
        sub_status = p_sub_status,
        notes = COALESCE(p_reason, notes),
        transitioned_at = NOW(),
        transitioned_by = auth.uid(),
        updated_at = NOW()
    WHERE id = v_workflow_id;
    
    -- 6. Insert history
    INSERT INTO trainee_workflow_history (
        trainee_id, from_stage, to_stage, sub_status, reason, changed_by, owner_department_id
    )
    SELECT 
        p_trainee_id,
        v_current_stage::trainee_workflow_stage,
        p_to_stage::trainee_workflow_stage,
        p_sub_status,
        p_reason,
        auth.uid(),
        tw.owner_department_id
    FROM trainee_workflow tw WHERE tw.trainee_id = p_trainee_id;
    
    -- 7. Execute side effects
    IF v_transition.auto_side_effects IS NOT NULL THEN
        IF 'create_dormitory_record' = ANY(v_transition.auto_side_effects) THEN
            PERFORM rpc_auto_create_dormitory_pending(p_trainee_id);
        END IF;
        
        IF 'checkout_dormitory' = ANY(v_transition.auto_side_effects) THEN
            PERFORM rpc_auto_checkout_dormitory(p_trainee_id);
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'from_stage', v_current_stage,
        'to_stage', p_to_stage,
        'sub_status', p_sub_status,
        'message', format('Đã chuyển trạng thái từ %s sang %s', v_current_stage, p_to_stage)
    );
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.rpc_auto_create_dormitory_pending(p_trainee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dormitory_residents 
        WHERE trainee_id = p_trainee_id 
        AND status IN ('pending', 'active')
    ) THEN
        INSERT INTO dormitory_residents (trainee_id, dormitory_id, status, check_in_date, notes)
        SELECT p_trainee_id, 
               (SELECT id FROM dormitories WHERE status = 'active' ORDER BY capacity DESC LIMIT 1),
               'pending',
               CURRENT_DATE,
               'Tự động tạo khi nhập học'
        WHERE EXISTS (SELECT 1 FROM dormitories WHERE status = 'active');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_auto_checkout_dormitory(p_trainee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE dormitory_residents
    SET status = 'checked_out',
        check_out_date = CURRENT_DATE,
        notes = COALESCE(notes || ' | ', '') || 'Tự động checkout khi chuyển stage',
        updated_at = NOW()
    WHERE trainee_id = p_trainee_id
    AND status IN ('pending', 'active');
END;
$$;

-- Get allowed transitions
CREATE OR REPLACE FUNCTION public.rpc_get_allowed_transitions(p_trainee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stage TEXT;
    v_transitions JSONB;
BEGIN
    SELECT current_stage::TEXT INTO v_current_stage
    FROM trainee_workflow
    WHERE trainee_id = p_trainee_id;
    
    IF v_current_stage IS NULL THEN
        RETURN jsonb_build_object('current_stage', NULL, 'transitions', '[]'::jsonb);
    END IF;
    
    SELECT jsonb_agg(jsonb_build_object(
        'to_stage', mt.to_stage,
        'stage_name', ms.stage_name,
        'stage_name_jp', ms.stage_name_jp,
        'condition', mt.condition_description,
        'requires_fields', mt.requires_fields,
        'ui_color', ms.ui_color
    ) ORDER BY ms.order_index)
    INTO v_transitions
    FROM master_stage_transitions mt
    JOIN master_trainee_stages ms ON ms.stage_code = mt.to_stage
    WHERE mt.from_stage = v_current_stage;
    
    RETURN jsonb_build_object(
        'current_stage', v_current_stage,
        'transitions', COALESCE(v_transitions, '[]'::jsonb)
    );
END;
$$;

-- Get stage timeline
CREATE OR REPLACE FUNCTION public.rpc_get_stage_timeline(p_trainee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_timeline JSONB;
    v_current JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'id', h.id,
        'from_stage', h.from_stage,
        'to_stage', h.to_stage,
        'from_name', ms_from.stage_name,
        'to_name', ms_to.stage_name,
        'sub_status', h.sub_status,
        'reason', h.reason,
        'changed_at', h.created_at,
        'changed_by', p.full_name
    ) ORDER BY h.created_at DESC)
    INTO v_timeline
    FROM trainee_workflow_history h
    LEFT JOIN master_trainee_stages ms_from ON ms_from.stage_code = h.from_stage::TEXT
    LEFT JOIN master_trainee_stages ms_to ON ms_to.stage_code = h.to_stage::TEXT
    LEFT JOIN profiles p ON p.user_id = h.changed_by
    WHERE h.trainee_id = p_trainee_id;
    
    SELECT jsonb_build_object(
        'current_stage', tw.current_stage,
        'stage_name', ms.stage_name,
        'stage_name_jp', ms.stage_name_jp,
        'sub_status', tw.sub_status,
        'ui_color', ms.ui_color,
        'transitioned_at', tw.transitioned_at
    )
    INTO v_current
    FROM trainee_workflow tw
    LEFT JOIN master_trainee_stages ms ON ms.stage_code = tw.current_stage::TEXT
    WHERE tw.trainee_id = p_trainee_id;
    
    RETURN jsonb_build_object(
        'current', v_current,
        'history', COALESCE(v_timeline, '[]'::jsonb)
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.rpc_transition_trainee_stage TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_allowed_transitions TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_stage_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_auto_create_dormitory_pending TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_auto_checkout_dormitory TO authenticated;