
DROP FUNCTION IF EXISTS public.get_trainee_full_profile(text);

CREATE OR REPLACE FUNCTION public.get_trainee_full_profile(p_trainee_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  trainee_record RECORD;
  result jsonb;
  can_view_pii boolean;
  workflow_data jsonb;
  company_data jsonb;
  union_data jsonb;
  job_category_data jsonb;
  class_data jsonb;
  interview_data jsonb;
  reviews_data jsonb;
  test_scores_data jsonb;
  attendance_data jsonb;
  education_data jsonb;
  work_data jsonb;
  family_data jsonb;
  japan_relatives_data jsonb;
  enrollment_data jsonb;
BEGIN
  -- Check PII permission
  can_view_pii := can_view_trainee_pii();

  -- Get trainee basic info
  SELECT * INTO trainee_record
  FROM trainees t
  WHERE t.code = p_trainee_code;

  IF trainee_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy học viên');
  END IF;

  -- Get workflow info
  SELECT jsonb_build_object(
    'stage', tw.stage,
    'status', tw.status,
    'current_step', tw.current_step,
    'visa_status', tw.visa_status,
    'visa_application_date', tw.visa_application_date,
    'visa_issue_date', tw.visa_issue_date,
    'visa_expiry_date', tw.visa_expiry_date,
    'coe_status', tw.coe_status,
    'coe_application_date', tw.coe_application_date,
    'coe_issue_date', tw.coe_issue_date,
    'contract_signed_date', tw.contract_signed_date,
    'contract_term', tw.contract_term,
    'expected_entry_date', tw.expected_entry_date,
    'actual_entry_date', tw.actual_entry_date,
    'departure_date', tw.departure_date,
    'return_date', tw.return_date,
    'receiving_company_id', tw.receiving_company_id,
    'sending_union_id', tw.sending_union_id,
    'job_category_id', tw.job_category_id,
    'assigned_class_id', tw.assigned_class_id
  ) INTO workflow_data
  FROM trainee_workflow tw WHERE tw.trainee_id = trainee_record.id;

  -- Get company info
  IF workflow_data->>'receiving_company_id' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'name', c.name,
      'name_japanese', c.name_japanese,
      'country', c.country,
      'address', c.address,
      'work_address', c.work_address
    ) INTO company_data
    FROM companies c WHERE c.id = (workflow_data->>'receiving_company_id')::uuid;
  END IF;

  -- Get union info
  IF workflow_data->>'sending_union_id' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'code', u.code,
      'name', u.name,
      'name_japanese', u.name_japanese
    ) INTO union_data
    FROM unions u WHERE u.id = (workflow_data->>'sending_union_id')::uuid;
  END IF;

  -- Get job category info
  IF workflow_data->>'job_category_id' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', jc.id,
      'code', jc.code,
      'name', jc.name,
      'name_japanese', jc.name_japanese,
      'category', jc.category
    ) INTO job_category_data
    FROM job_categories jc WHERE jc.id = (workflow_data->>'job_category_id')::uuid;
  END IF;

  -- Get class info
  IF workflow_data->>'assigned_class_id' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cl.id,
      'code', cl.code,
      'name', cl.name,
      'level', cl.level,
      'status', cl.status,
      'start_date', cl.start_date,
      'expected_end_date', cl.expected_end_date
    ) INTO class_data
    FROM classes cl WHERE cl.id = (workflow_data->>'assigned_class_id')::uuid;
  END IF;

  -- Get interview history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ih.id,
      'interview_date', ih.interview_date,
      'result', ih.result,
      'expected_entry_month', ih.expected_entry_month,
      'notes', ih.notes,
      'company_name', c.name,
      'union_name', u.name,
      'job_category_name', jc.name
    ) ORDER BY ih.interview_date DESC
  ), '[]'::jsonb) INTO interview_data
  FROM interview_history ih
  LEFT JOIN companies c ON c.id = ih.company_id
  LEFT JOIN unions u ON u.id = ih.union_id
  LEFT JOIN job_categories jc ON jc.id = ih.job_category_id
  WHERE ih.trainee_id = trainee_record.id;

  -- Get reviews
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tr.id,
      'review_date', tr.review_date,
      'reviewer', tr.reviewer,
      'attitude_score', tr.attitude_score,
      'discipline_score', tr.discipline_score,
      'learning_score', tr.learning_score,
      'overall_score', tr.overall_score,
      'comments', tr.comments
    ) ORDER BY tr.review_date DESC
  ), '[]'::jsonb) INTO reviews_data
  FROM trainee_reviews tr WHERE tr.trainee_id = trainee_record.id;

  -- Get test scores
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ts.id,
      'test_date', ts.test_date,
      'test_type', ts.test_type,
      'score', ts.score,
      'max_score', ts.max_score,
      'level', ts.level,
      'passed', ts.passed,
      'evaluation', ts.evaluation,
      'notes', ts.notes
    ) ORDER BY ts.test_date DESC
  ), '[]'::jsonb) INTO test_scores_data
  FROM test_scores ts WHERE ts.trainee_id = trainee_record.id;

  -- Get attendance
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'date', a.date,
      'status', a.status,
      'notes', a.notes
    ) ORDER BY a.date DESC
  ), '[]'::jsonb) INTO attendance_data
  FROM attendance a WHERE a.trainee_id = trainee_record.id;

  -- Get education history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', eh.id,
      'school_name', eh.school_name,
      'level', eh.level,
      'major', eh.major,
      'start_year', eh.start_year,
      'end_year', eh.end_year
    ) ORDER BY eh.end_year DESC NULLS LAST
  ), '[]'::jsonb) INTO education_data
  FROM education_history eh WHERE eh.trainee_id = trainee_record.id;

  -- Get work history (corrected - no responsibilities column)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', wh.id,
      'company_name', wh.company_name,
      'position', wh.position,
      'start_date', wh.start_date,
      'end_date', wh.end_date
    ) ORDER BY wh.end_date DESC NULLS LAST
  ), '[]'::jsonb) INTO work_data
  FROM work_history wh WHERE wh.trainee_id = trainee_record.id;

  -- Get family members
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fm.id,
      'full_name', fm.full_name,
      'relationship', fm.relationship,
      'gender', fm.gender,
      'birth_year', fm.birth_year,
      'occupation', fm.occupation,
      'location', fm.location,
      'income', fm.income
    ) ORDER BY fm.birth_year ASC NULLS LAST
  ), '[]'::jsonb) INTO family_data
  FROM family_members fm WHERE fm.trainee_id = trainee_record.id;

  -- Get japan relatives
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', jr.id,
      'full_name', jr.full_name,
      'relationship', jr.relationship,
      'gender', jr.gender,
      'age', jr.age,
      'address_japan', jr.address_japan,
      'residence_status', jr.residence_status
    )
  ), '[]'::jsonb) INTO japan_relatives_data
  FROM japan_relatives jr WHERE jr.trainee_id = trainee_record.id;

  -- Get enrollment history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', enh.id,
      'action_type', enh.action_type,
      'action_date', enh.action_date,
      'notes', enh.notes,
      'from_class', fc.name,
      'to_class', tc.name
    ) ORDER BY enh.action_date DESC
  ), '[]'::jsonb) INTO enrollment_data
  FROM enrollment_history enh
  LEFT JOIN classes fc ON fc.id = enh.from_class_id
  LEFT JOIN classes tc ON tc.id = enh.to_class_id
  WHERE enh.trainee_id = trainee_record.id;

  -- Build final result with PII masking
  result := jsonb_build_object(
    'id', trainee_record.id,
    'code', trainee_record.code,
    'full_name', trainee_record.full_name,
    'full_name_katakana', trainee_record.full_name_katakana,
    'gender', trainee_record.gender,
    'date_of_birth', trainee_record.date_of_birth,
    'birthplace', trainee_record.birthplace,
    'ethnicity', trainee_record.ethnicity,
    'religion', trainee_record.religion,
    'marital_status', trainee_record.marital_status,
    'trainee_type', trainee_record.trainee_type,
    'source', trainee_record.source,
    'photo_url', trainee_record.photo_url,
    'address', trainee_record.address,
    'height', trainee_record.height,
    'weight', trainee_record.weight,
    'blood_type', trainee_record.blood_type,
    'dominant_hand', trainee_record.dominant_hand,
    'eyesight_left', trainee_record.eyesight_left,
    'eyesight_right', trainee_record.eyesight_right,
    'has_tattoo', trainee_record.has_tattoo,
    'smoking', trainee_record.smoking,
    'drinking', trainee_record.drinking,
    'registration_date', trainee_record.registration_date,
    'notes', trainee_record.notes,
    'created_at', trainee_record.created_at,
    'updated_at', trainee_record.updated_at,
    -- PII fields (masked if no permission)
    'phone', CASE WHEN can_view_pii THEN trainee_record.phone ELSE '***masked***' END,
    'email', CASE WHEN can_view_pii THEN trainee_record.email ELSE '***masked***' END,
    'cccd_number', CASE WHEN can_view_pii THEN trainee_record.cccd_number ELSE '***masked***' END,
    'cccd_issue_date', CASE WHEN can_view_pii THEN trainee_record.cccd_issue_date ELSE NULL END,
    'cccd_issue_place', CASE WHEN can_view_pii THEN trainee_record.cccd_issue_place ELSE '***masked***' END,
    'passport_number', CASE WHEN can_view_pii THEN trainee_record.passport_number ELSE '***masked***' END,
    'passport_issue_date', CASE WHEN can_view_pii THEN trainee_record.passport_issue_date ELSE NULL END,
    'passport_expiry_date', CASE WHEN can_view_pii THEN trainee_record.passport_expiry_date ELSE NULL END,
    'passport_issue_place', CASE WHEN can_view_pii THEN trainee_record.passport_issue_place ELSE '***masked***' END,
    'father_phone', CASE WHEN can_view_pii THEN trainee_record.father_phone ELSE '***masked***' END,
    'mother_phone', CASE WHEN can_view_pii THEN trainee_record.mother_phone ELSE '***masked***' END,
    -- Related data
    'workflow', workflow_data,
    'company', company_data,
    'union', union_data,
    'job_category', job_category_data,
    'class', class_data,
    'interview_history', interview_data,
    'reviews', reviews_data,
    'test_scores', test_scores_data,
    'attendance', attendance_data,
    'education_history', education_data,
    'work_history', work_data,
    'family_members', family_data,
    'japan_relatives', japan_relatives_data,
    'enrollment_history', enrollment_data,
    'violations', '[]'::jsonb,
    'notes_history', '[]'::jsonb
  );

  RETURN result;
END;
$function$;
