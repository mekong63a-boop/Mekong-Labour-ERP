-- Update RPC function to include evaluation field in test_scores
CREATE OR REPLACE FUNCTION public.get_trainee_full_profile(p_trainee_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trainee_record RECORD;
  result jsonb;
  can_view_pii boolean := true;
  company_data jsonb;
  union_data jsonb;
  job_data jsonb;
  class_data jsonb;
  workflow_data jsonb;
  interview_data jsonb;
  notes_data jsonb;
  violations_data jsonb;
  reviews_data jsonb;
  attendance_data jsonb;
  test_scores_data jsonb;
BEGIN
  -- Get trainee by code
  SELECT * INTO trainee_record
  FROM trainees
  WHERE trainee_code = p_trainee_code;

  IF trainee_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy học viên với mã: ' || p_trainee_code);
  END IF;

  -- Check PII visibility (admin and senior staff can see PII)
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  ) INTO can_view_pii;

  -- Get company info
  IF trainee_record.company_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'name', c.name,
      'name_japanese', c.name_japanese
    ) INTO company_data
    FROM companies c WHERE c.id = trainee_record.company_id;
  ELSE
    company_data := '{}'::jsonb;
  END IF;

  -- Get union info
  IF trainee_record.union_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'code', u.code,
      'name', u.name,
      'name_japanese', u.name_japanese
    ) INTO union_data
    FROM unions u WHERE u.id = trainee_record.union_id;
  ELSE
    union_data := '{}'::jsonb;
  END IF;

  -- Get job category info
  IF trainee_record.job_category_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', j.id,
      'code', j.code,
      'name', j.name,
      'name_japanese', j.name_japanese
    ) INTO job_data
    FROM job_categories j WHERE j.id = trainee_record.job_category_id;
  ELSE
    job_data := '{}'::jsonb;
  END IF;

  -- Get class info
  IF trainee_record.class_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cl.id,
      'code', cl.code,
      'name', cl.name
    ) INTO class_data
    FROM classes cl WHERE cl.id = trainee_record.class_id;
  ELSE
    class_data := '{}'::jsonb;
  END IF;

  -- Get workflow info
  SELECT jsonb_build_object(
    'current_stage', tw.current_stage,
    'sub_status', tw.sub_status,
    'transitioned_at', tw.transitioned_at
  ) INTO workflow_data
  FROM trainee_workflow tw WHERE tw.trainee_id = trainee_record.id;
  
  IF workflow_data IS NULL THEN
    workflow_data := '{}'::jsonb;
  END IF;

  -- Get interview history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'interview_date', ih.interview_date,
      'result', ih.result,
      'notes', ih.notes,
      'company_id', ih.company_id
    ) ORDER BY ih.interview_date DESC
  ), '[]'::jsonb) INTO interview_data
  FROM interview_history ih WHERE ih.trainee_id = trainee_record.id;

  -- Get trainee notes
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tn.id,
      'note_type', tn.note_type,
      'content', tn.content,
      'created_at', tn.created_at
    ) ORDER BY tn.created_at DESC
  ), '[]'::jsonb) INTO notes_data
  FROM trainee_notes tn WHERE tn.trainee_id = trainee_record.id;

  -- Get violations
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', v.id,
      'violation_type', v.violation_type,
      'description', v.description,
      'violation_date', v.violation_date,
      'status', v.status
    ) ORDER BY v.violation_date DESC
  ), '[]'::jsonb) INTO violations_data
  FROM violations v WHERE v.trainee_id = trainee_record.id;

  -- Get reviews
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'review_type', r.review_type,
      'content', r.content,
      'rating', r.rating,
      'is_blacklisted', r.is_blacklisted,
      'blacklist_reason', r.blacklist_reason,
      'created_at', r.created_at
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO reviews_data
  FROM trainee_reviews r WHERE r.trainee_id = trainee_record.id;

  -- Get attendance history (training records)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'date', a.date,
      'status', a.status,
      'notes', a.notes,
      'class_id', a.class_id,
      'class_name', cl.name
    ) ORDER BY a.date DESC
  ), '[]'::jsonb) INTO attendance_data
  FROM attendance a
  LEFT JOIN classes cl ON cl.id = a.class_id
  WHERE a.trainee_id = trainee_record.id;

  -- Get test scores WITH evaluation field
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ts.id,
      'test_name', ts.test_name,
      'test_date', ts.test_date,
      'score', ts.score,
      'max_score', ts.max_score,
      'notes', ts.notes,
      'evaluation', ts.evaluation,
      'class_id', ts.class_id,
      'class_name', cl.name
    ) ORDER BY ts.test_date DESC
  ), '[]'::jsonb) INTO test_scores_data
  FROM test_scores ts
  LEFT JOIN classes cl ON cl.id = ts.class_id
  WHERE ts.trainee_id = trainee_record.id;

  -- Build result
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
    'birthplace', trainee_record.birthplace,
    'permanent_address', trainee_record.permanent_address,
    'current_address', trainee_record.current_address,
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
    'progression_stage', trainee_record.progression_stage,
    'simple_status', trainee_record.simple_status,
    'enrollment_status', trainee_record.enrollment_status,
    'notes', trainee_record.notes,
    'company', company_data,
    'union', union_data,
    'job_category', job_data,
    'class', class_data,
    'workflow', workflow_data,
    'interview_history', interview_data,
    'trainee_notes', notes_data,
    'violations', violations_data,
    'reviews', reviews_data,
    'attendance', attendance_data,
    'test_scores', test_scores_data,
    'can_view_pii', can_view_pii
  );

  -- Mask PII if user doesn't have permission
  IF NOT can_view_pii THEN
    result := result || jsonb_build_object(
      'phone', '***ẩn***',
      'zalo', '***ẩn***',
      'email', '***ẩn***',
      'parent_phone_1', '***ẩn***',
      'parent_phone_2', '***ẩn***',
      'cccd_number', '***ẩn***',
      'cccd_date', NULL,
      'passport_number', '***ẩn***',
      'passport_date', NULL
    );
  ELSE
    result := result || jsonb_build_object(
      'phone', trainee_record.phone,
      'zalo', trainee_record.zalo,
      'email', trainee_record.email,
      'parent_phone_1', trainee_record.parent_phone_1,
      'parent_phone_2', trainee_record.parent_phone_2,
      'cccd_number', trainee_record.cccd_number,
      'cccd_date', trainee_record.cccd_date,
      'passport_number', trainee_record.passport_number,
      'passport_date', trainee_record.passport_date
    );
  END IF;

  RETURN result;
END;
$$;