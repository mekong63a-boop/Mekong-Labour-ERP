CREATE OR REPLACE FUNCTION public.get_trainee_full_profile(p_trainee_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  can_view_pii := public.can_view_trainee_pii();

  SELECT * INTO trainee_record
  FROM public.trainees t
  WHERE t.trainee_code = p_trainee_code;

  IF trainee_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy học viên');
  END IF;

  SELECT jsonb_build_object(
    'stage', tw.current_stage,
    'status', tw.sub_status,
    'current_stage', tw.current_stage,
    'sub_status', tw.sub_status,
    'contract_term', trainee_record.contract_term,
    'actual_entry_date', trainee_record.entry_date,
    'departure_date', trainee_record.departure_date,
    'return_date', trainee_record.return_date,
    'receiving_company_id', trainee_record.receiving_company_id,
    'sending_union_id', trainee_record.union_id,
    'job_category_id', trainee_record.job_category_id,
    'assigned_class_id', trainee_record.class_id,
    'current_step', NULL,
    'visa_status', NULL,
    'visa_application_date', NULL,
    'visa_issue_date', NULL,
    'visa_expiry_date', NULL,
    'coe_status', NULL,
    'coe_application_date', NULL,
    'coe_issue_date', NULL,
    'contract_signed_date', NULL,
    'expected_entry_date', NULL
  )
  INTO workflow_data
  FROM public.trainee_workflow tw
  WHERE tw.trainee_id = trainee_record.id;

  IF trainee_record.receiving_company_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'name', c.name,
      'name_japanese', c.name_japanese,
      'country', c.country,
      'address', c.address,
      'work_address', c.work_address
    )
    INTO company_data
    FROM public.companies c
    WHERE c.id = trainee_record.receiving_company_id;
  END IF;

  IF trainee_record.union_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'code', u.code,
      'name', u.name,
      'name_japanese', u.name_japanese
    )
    INTO union_data
    FROM public.unions u
    WHERE u.id = trainee_record.union_id;
  END IF;

  IF trainee_record.job_category_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', jc.id,
      'code', jc.code,
      'name', jc.name,
      'name_japanese', jc.name_japanese,
      'category', jc.category
    )
    INTO job_category_data
    FROM public.job_categories jc
    WHERE jc.id = trainee_record.job_category_id;
  END IF;

  IF trainee_record.class_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cl.id,
      'code', cl.code,
      'name', cl.name,
      'level', cl.level,
      'status', cl.status,
      'start_date', cl.start_date,
      'expected_end_date', cl.expected_end_date
    )
    INTO class_data
    FROM public.classes cl
    WHERE cl.id = trainee_record.class_id;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ih.id,
        'interview_date', ih.interview_date,
        'result', ih.result,
        'expected_entry_month', ih.expected_entry_month,
        'notes', ih.notes,
        'company_name', c.name,
        'union_name', u.name,
        'job_category_name', jc.name
      )
      ORDER BY ih.interview_date DESC
    ),
    '[]'::jsonb
  )
  INTO interview_data
  FROM public.interview_history ih
  LEFT JOIN public.companies c ON c.id = ih.company_id
  LEFT JOIN public.unions u ON u.id = ih.union_id
  LEFT JOIN public.job_categories jc ON jc.id = ih.job_category_id
  WHERE ih.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', tr.id,
        'review_date', tr.created_at,
        'review_type', tr.review_type,
        'overall_score', tr.rating,
        'comments', tr.content,
        'is_blacklisted', tr.is_blacklisted,
        'blacklist_reason', tr.blacklist_reason
      )
      ORDER BY tr.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO reviews_data
  FROM public.trainee_reviews tr
  WHERE tr.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ts.id,
        'test_date', ts.test_date,
        'test_type', ts.test_name,
        'score', ts.score,
        'max_score', ts.max_score,
        'evaluation', ts.evaluation,
        'notes', ts.notes
      )
      ORDER BY ts.test_date DESC
    ),
    '[]'::jsonb
  )
  INTO test_scores_data
  FROM public.test_scores ts
  WHERE ts.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'date', a.date,
        'status', a.status,
        'notes', a.notes
      )
      ORDER BY a.date DESC
    ),
    '[]'::jsonb
  )
  INTO attendance_data
  FROM public.attendance a
  WHERE a.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', eh.id,
        'school_name', eh.school_name,
        'level', eh.level,
        'major', eh.major,
        'start_year', eh.start_year,
        'end_year', eh.end_year
      )
      ORDER BY eh.end_year DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO education_data
  FROM public.education_history eh
  WHERE eh.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', wh.id,
        'company_name', wh.company_name,
        'position', wh.position,
        'start_date', wh.start_date,
        'end_date', wh.end_date
      )
      ORDER BY wh.end_date DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO work_data
  FROM public.work_history wh
  WHERE wh.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', fm.id,
        'full_name', fm.full_name,
        'relationship', fm.relationship,
        'gender', fm.gender,
        'birth_year', fm.birth_year,
        'occupation', fm.occupation,
        'location', fm.location,
        'income', fm.income
      )
      ORDER BY fm.birth_year ASC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO family_data
  FROM public.family_members fm
  WHERE fm.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', jr.id,
        'full_name', jr.full_name,
        'relationship', jr.relationship,
        'gender', jr.gender,
        'age', jr.age,
        'address_japan', jr.address_japan,
        'residence_status', jr.residence_status
      )
    ),
    '[]'::jsonb
  )
  INTO japan_relatives_data
  FROM public.japan_relatives jr
  WHERE jr.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', enh.id,
        'action_type', enh.action_type,
        'action_date', enh.action_date,
        'notes', enh.notes,
        'from_class', fc.name,
        'to_class', tc.name
      )
      ORDER BY enh.action_date DESC
    ),
    '[]'::jsonb
  )
  INTO enrollment_data
  FROM public.enrollment_history enh
  LEFT JOIN public.classes fc ON fc.id = enh.from_class_id
  LEFT JOIN public.classes tc ON tc.id = enh.to_class_id
  WHERE enh.trainee_id = trainee_record.id;

  -- Build result in chunks to avoid jsonb_build_object 100-args limit
  result := jsonb_build_object(
    'id', trainee_record.id,
    'code', trainee_record.trainee_code,
    'full_name', trainee_record.full_name,
    'full_name_katakana', trainee_record.furigana,
    'gender', trainee_record.gender,
    'date_of_birth', trainee_record.birth_date,
    'birthplace', trainee_record.birthplace,
    'ethnicity', trainee_record.ethnicity,
    'religion', trainee_record.religion,
    'marital_status', trainee_record.marital_status,
    'trainee_type', trainee_record.trainee_type,
    'source', trainee_record.source,
    'photo_url', trainee_record.photo_url,
    'address', trainee_record.current_address,
    'permanent_address', trainee_record.permanent_address,
    'household_address', trainee_record.household_address,
    'temp_address', trainee_record.temp_address,
    'height', trainee_record.height,
    'weight', trainee_record.weight,
    'blood_type', trainee_record.blood_group,
    'dominant_hand', trainee_record.dominant_hand,
    'eyesight_left', trainee_record.vision_left,
    'eyesight_right', trainee_record.vision_right,
    'has_tattoo', trainee_record.tattoo,
    'tattoo_description', trainee_record.tattoo_description,
    'smoking', trainee_record.smoking,
    'drinking', trainee_record.drinking,
    'health_status', trainee_record.health_status,
    'hobbies', trainee_record.hobbies,
    'registration_date', trainee_record.registration_date,
    'entry_date', trainee_record.entry_date,
    'notes', trainee_record.notes,
    'created_at', trainee_record.created_at,
    'updated_at', trainee_record.updated_at
  );

  result := result || jsonb_build_object(
    'phone', CASE WHEN can_view_pii THEN trainee_record.phone ELSE '***masked***' END,
    'email', CASE WHEN can_view_pii THEN trainee_record.email ELSE '***masked***' END,
    'cccd_number', CASE WHEN can_view_pii THEN trainee_record.cccd_number ELSE '***masked***' END,
    'cccd_issue_date', CASE WHEN can_view_pii THEN trainee_record.cccd_date ELSE NULL END,
    'cccd_issue_place', CASE WHEN can_view_pii THEN trainee_record.cccd_place ELSE '***masked***' END,
    'passport_number', CASE WHEN can_view_pii THEN trainee_record.passport_number ELSE '***masked***' END,
    'passport_issue_date', CASE WHEN can_view_pii THEN trainee_record.passport_date ELSE NULL END,
    'father_phone', CASE WHEN can_view_pii THEN trainee_record.parent_phone_1 ELSE '***masked***' END,
    'mother_phone', CASE WHEN can_view_pii THEN trainee_record.parent_phone_2 ELSE '***masked***' END,
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
    'trainee_notes', '[]'::jsonb,
    'can_view_pii', can_view_pii
  );

  RETURN result;
END;
$$;