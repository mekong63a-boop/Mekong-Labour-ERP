-- =====================================================
-- RPC: rpc_transition_trainee_stage
-- Single source of truth for trainee status transitions
-- =====================================================

CREATE OR REPLACE FUNCTION public.rpc_transition_trainee_stage(
  p_trainee_id UUID,
  p_to_stage trainee_workflow_stage,
  p_sub_status TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_stage trainee_workflow_stage;
  v_workflow_id UUID;
  v_user_id UUID;
  v_mapped_simple_status simple_status;
  v_mapped_progression_stage progression_stage;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get current workflow state
  SELECT id, current_stage INTO v_workflow_id, v_from_stage
  FROM trainee_workflow
  WHERE trainee_id = p_trainee_id;
  
  -- If no workflow exists, create one
  IF v_workflow_id IS NULL THEN
    INSERT INTO trainee_workflow (trainee_id, current_stage, sub_status, transitioned_by, transitioned_at)
    VALUES (p_trainee_id, p_to_stage, p_sub_status, v_user_id, NOW())
    RETURNING id INTO v_workflow_id;
    
    v_from_stage := NULL;
  ELSE
    -- Update existing workflow
    UPDATE trainee_workflow
    SET 
      current_stage = p_to_stage,
      sub_status = p_sub_status,
      transitioned_by = v_user_id,
      transitioned_at = NOW(),
      updated_at = NOW()
    WHERE id = v_workflow_id;
  END IF;
  
  -- Insert history record
  INSERT INTO trainee_workflow_history (
    trainee_id,
    from_stage,
    to_stage,
    sub_status,
    reason,
    changed_by,
    created_at
  ) VALUES (
    p_trainee_id,
    v_from_stage,
    p_to_stage,
    p_sub_status,
    p_reason,
    v_user_id,
    NOW()
  );
  
  -- Map workflow stage to simple_status
  v_mapped_simple_status := CASE p_to_stage
    WHEN 'recruited' THEN 'Đang học'::simple_status
    WHEN 'training' THEN 'Đang học'::simple_status
    WHEN 'interview_scheduled' THEN 'Đang học'::simple_status
    WHEN 'interview_passed' THEN 'Đang học'::simple_status
    WHEN 'visa_processing' THEN 'Đang học'::simple_status
    WHEN 'ready_to_depart' THEN 'Đang học'::simple_status
    WHEN 'departed' THEN 'Đã xuất cảnh'::simple_status
    WHEN 'working_in_japan' THEN 'Đã xuất cảnh'::simple_status
    WHEN 'contract_completed' THEN 'Hoàn thành'::simple_status
    WHEN 'early_return' THEN 'Về nước sớm'::simple_status
    WHEN 'absconded' THEN 'Bỏ trốn'::simple_status
    WHEN 'archived' THEN 'Lưu trữ'::simple_status
    ELSE 'Đang học'::simple_status
  END;
  
  -- Map workflow stage to progression_stage
  v_mapped_progression_stage := CASE p_to_stage
    WHEN 'recruited' THEN 'Chưa đậu'::progression_stage
    WHEN 'training' THEN 'Chưa đậu'::progression_stage
    WHEN 'interview_scheduled' THEN 'Chưa đậu'::progression_stage
    WHEN 'interview_passed' THEN 'Đậu phỏng vấn'::progression_stage
    WHEN 'visa_processing' THEN 'Nộp hồ sơ'::progression_stage
    WHEN 'ready_to_depart' THEN 'COE'::progression_stage
    WHEN 'departed' THEN 'Xuất cảnh'::progression_stage
    WHEN 'working_in_japan' THEN 'Đang làm việc'::progression_stage
    WHEN 'contract_completed' THEN 'Hoàn thành hợp đồng'::progression_stage
    WHEN 'early_return' THEN 'Về trước hạn'::progression_stage
    WHEN 'absconded' THEN 'Bỏ trốn'::progression_stage
    WHEN 'archived' THEN 'Hoàn thành hợp đồng'::progression_stage
    ELSE 'Chưa đậu'::progression_stage
  END;
  
  -- Sync to trainees table (for backward compatibility with list views)
  UPDATE trainees
  SET 
    simple_status = v_mapped_simple_status,
    progression_stage = v_mapped_progression_stage,
    updated_at = NOW()
  WHERE id = p_trainee_id;
  
  -- Return result
  RETURN json_build_object(
    'success', true,
    'trainee_id', p_trainee_id,
    'from_stage', v_from_stage,
    'to_stage', p_to_stage,
    'sub_status', p_sub_status
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_transition_trainee_stage TO authenticated;

-- =====================================================
-- TRIGGER: Auto-sync trainee_workflow changes to trainees
-- Ensures consistency if workflow is updated directly
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_trainee_status_from_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mapped_simple_status simple_status;
  v_mapped_progression_stage progression_stage;
BEGIN
  -- Map workflow stage to simple_status
  v_mapped_simple_status := CASE NEW.current_stage
    WHEN 'recruited' THEN 'Đang học'::simple_status
    WHEN 'training' THEN 'Đang học'::simple_status
    WHEN 'interview_scheduled' THEN 'Đang học'::simple_status
    WHEN 'interview_passed' THEN 'Đang học'::simple_status
    WHEN 'visa_processing' THEN 'Đang học'::simple_status
    WHEN 'ready_to_depart' THEN 'Đang học'::simple_status
    WHEN 'departed' THEN 'Đã xuất cảnh'::simple_status
    WHEN 'working_in_japan' THEN 'Đã xuất cảnh'::simple_status
    WHEN 'contract_completed' THEN 'Hoàn thành'::simple_status
    WHEN 'early_return' THEN 'Về nước sớm'::simple_status
    WHEN 'absconded' THEN 'Bỏ trốn'::simple_status
    WHEN 'archived' THEN 'Lưu trữ'::simple_status
    ELSE 'Đang học'::simple_status
  END;
  
  -- Map workflow stage to progression_stage
  v_mapped_progression_stage := CASE NEW.current_stage
    WHEN 'recruited' THEN 'Chưa đậu'::progression_stage
    WHEN 'training' THEN 'Chưa đậu'::progression_stage
    WHEN 'interview_scheduled' THEN 'Chưa đậu'::progression_stage
    WHEN 'interview_passed' THEN 'Đậu phỏng vấn'::progression_stage
    WHEN 'visa_processing' THEN 'Nộp hồ sơ'::progression_stage
    WHEN 'ready_to_depart' THEN 'COE'::progression_stage
    WHEN 'departed' THEN 'Xuất cảnh'::progression_stage
    WHEN 'working_in_japan' THEN 'Đang làm việc'::progression_stage
    WHEN 'contract_completed' THEN 'Hoàn thành hợp đồng'::progression_stage
    WHEN 'early_return' THEN 'Về trước hạn'::progression_stage
    WHEN 'absconded' THEN 'Bỏ trốn'::progression_stage
    WHEN 'archived' THEN 'Hoàn thành hợp đồng'::progression_stage
    ELSE 'Chưa đậu'::progression_stage
  END;
  
  -- Update trainees table
  UPDATE trainees
  SET 
    simple_status = v_mapped_simple_status,
    progression_stage = v_mapped_progression_stage,
    updated_at = NOW()
  WHERE id = NEW.trainee_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_sync_trainee_status ON trainee_workflow;

CREATE TRIGGER trigger_sync_trainee_status
  AFTER INSERT OR UPDATE OF current_stage ON trainee_workflow
  FOR EACH ROW
  EXECUTE FUNCTION sync_trainee_status_from_workflow();

-- =====================================================
-- Comment for documentation
-- =====================================================
COMMENT ON FUNCTION public.rpc_transition_trainee_stage IS 
'Single RPC for trainee status transitions. Updates trainee_workflow, creates history record, and syncs to trainees table for backward compatibility.';