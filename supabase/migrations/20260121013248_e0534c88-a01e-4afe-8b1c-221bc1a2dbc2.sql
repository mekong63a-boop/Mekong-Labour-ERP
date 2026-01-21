-- Fix the get_trainee_full_profile function to use correct table names
CREATE OR REPLACE FUNCTION public.get_trainee_full_profile(p_trainee_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  trainee_record record;
  can_view_pii boolean;
  workflow_data jsonb;
  company_data jsonb;
  union_data jsonb;
  job_category_data jsonb;
  class_data jsonb;
  interview_history_data jsonb;
  reviews_data jsonb;
BEGIN
  -- Check menu permission
  IF NOT public.has_menu_permission(auth.uid(), 'trainees', 'view') THEN
    RAISE EXCEPTION 'Không có quyền tra cứu học viên';
  END IF;

  -- Check PII permission
  can_view_pii := public.can_view_trainee_pii();

  -- Get trainee basic info
  SELECT * INTO trainee_record
  FROM trainees
  WHERE trainee_code = p_trainee_code;

  IF trainee_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy học viên với mã: ' || p_trainee_code);
  END IF;

  -- Get workflow data
  SELECT jsonb_build_object(
    'current_stage', tw.current_stage,
    'sub_status', tw.sub_status,
    'transitioned_at', tw.transitioned_at
  ) INTO workflow_data
  FROM trainee_workflow tw
  WHERE tw.trainee_id = trainee_record.id;

  -- Get company data
  IF trainee_record.receiving_company_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'name', c.name,
      'name_japanese', c.name_japanese
    ) INTO company_data
    FROM companies c
    WHERE c.id = trainee_record.receiving_company_id;
  END IF;

  -- Get union data
  IF trainee_record.union_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'code', u.code,
      'name', u.name,
      'name_japanese', u.name_japanese
    ) INTO union_data
    FROM unions u
    WHERE u.id = trainee_record.union_id;
  END IF;

  -- Get job category data
  IF trainee_record.job_category_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', jc.id,
      'code', jc.code,
      'name', jc.name
    ) INTO job_category_data
    FROM job_categories jc
    WHERE jc.id = trainee_record.job_category_id;
  END IF;

  -- Get class data
  IF trainee_record.class_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cl.id,
      'code', cl.code,
      'name', cl.name
    ) INTO class_data
    FROM classes cl
    WHERE cl.id = trainee_record.class_id;
  END IF;

  -- Get interview history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'interview_date', ih.interview_date,
      'result', ih.result,
      'notes', ih.notes,
      'company_id', ih.company_id
    ) ORDER BY ih.interview_date DESC
  ), '[]'::jsonb) INTO interview_history_data
  FROM interview_history ih
  WHERE ih.trainee_id = trainee_record.id;

  -- Get trainee reviews (includes notes and blacklist info)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tr.id,
      'review_type', tr.review_type,
      'content', tr.content,
      'rating', tr.rating,
      'is_blacklisted', tr.is_blacklisted,
      'blacklist_reason', tr.blacklist_reason,
      'created_at', tr.created_at
    ) ORDER BY tr.created_at DESC
  ), '[]'::jsonb) INTO reviews_data
  FROM trainee_reviews tr
  WHERE tr.trainee_id = trainee_record.id;

  -- Build result with PII masking if needed
  result := jsonb_build_object(
    'id', trainee_record.id,
    'trainee_code', trainee_record.trainee_code,
    'full_name', trainee_record.full_name,
    'furigana', trainee_record.furigana,
    'birth_date', trainee_record.birth_date,
    'gender', trainee_record.gender,
    'trainee_type', trainee_record.trainee_type,
    'source', trainee_record.source,
    'photo_url', trainee_record.photo_url,
    
    -- PII fields - mask if no permission
    'phone', CASE WHEN can_view_pii THEN trainee_record.phone ELSE public.mask_phone(trainee_record.phone) END,
    'zalo', CASE WHEN can_view_pii THEN trainee_record.zalo ELSE '***' END,
    'email', CASE WHEN can_view_pii THEN trainee_record.email ELSE public.mask_email(trainee_record.email) END,
    'cccd_number', CASE WHEN can_view_pii THEN trainee_record.cccd_number ELSE public.mask_cccd(trainee_record.cccd_number) END,
    'cccd_date', trainee_record.cccd_date,
    'passport_number', CASE WHEN can_view_pii THEN trainee_record.passport_number ELSE public.mask_passport(trainee_record.passport_number) END,
    'passport_date', trainee_record.passport_date,
    
    -- Addresses (always visible per PII rules)
    'permanent_address', trainee_record.permanent_address,
    'current_address', trainee_record.current_address,
    'birthplace', trainee_record.birthplace,
    
    -- Timeline dates
    'entry_date', trainee_record.entry_date,
    'interview_pass_date', trainee_record.interview_pass_date,
    'document_submission_date', trainee_record.document_submission_date,
    'otit_entry_date', trainee_record.otit_entry_date,
    'nyukan_entry_date', trainee_record.nyukan_entry_date,
    'coe_date', trainee_record.coe_date,
    'visa_date', trainee_record.visa_date,
    'departure_date', trainee_record.departure_date,
    'return_date', trainee_record.return_date,
    'expected_return_date', trainee_record.expected_return_date,
    
    -- Status
    'progression_stage', trainee_record.progression_stage,
    'simple_status', trainee_record.simple_status,
    'enrollment_status', trainee_record.enrollment_status,
    
    -- Notes
    'notes', trainee_record.notes,
    
    -- Related data
    'workflow', COALESCE(workflow_data, '{}'::jsonb),
    'company', COALESCE(company_data, '{}'::jsonb),
    'union', COALESCE(union_data, '{}'::jsonb),
    'job_category', COALESCE(job_category_data, '{}'::jsonb),
    'class', COALESCE(class_data, '{}'::jsonb),
    'interview_history', interview_history_data,
    'reviews', reviews_data,
    
    -- Permission flag
    'can_view_pii', can_view_pii
  );

  RETURN result;
END;
$function$;