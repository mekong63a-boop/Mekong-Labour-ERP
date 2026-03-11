
-- ============================================
-- SYSTEM CLEANUP: Remove dead workflow system
-- ============================================

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_auto_create_workflow ON trainees;
DROP TRIGGER IF EXISTS trigger_sync_trainee_status ON trainee_workflow;
DROP TRIGGER IF EXISTS trigger_workflow_transition ON trainee_workflow;
DROP TRIGGER IF EXISTS update_trainee_workflow_updated_at ON trainee_workflow;

-- 2. Drop views
DROP VIEW IF EXISTS trainees_with_workflow CASCADE;
DROP VIEW IF EXISTS dashboard_trainee_by_stage CASCADE;

-- 3. Drop tables (dependency order)
DROP TABLE IF EXISTS trainee_workflow_history CASCADE;
DROP TABLE IF EXISTS trainee_workflow CASCADE;
DROP TABLE IF EXISTS master_stage_transitions CASCADE;
DROP TABLE IF EXISTS master_terminated_reasons CASCADE;
DROP TABLE IF EXISTS master_trainee_stages CASCADE;

-- 4. Drop functions
DROP FUNCTION IF EXISTS auto_create_trainee_workflow() CASCADE;
DROP FUNCTION IF EXISTS sync_trainee_status_from_workflow() CASCADE;
DROP FUNCTION IF EXISTS log_workflow_transition() CASCADE;
DROP FUNCTION IF EXISTS transition_trainee_stage(uuid, trainee_workflow_stage, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_trainee_workflow(uuid) CASCADE;
DROP FUNCTION IF EXISTS map_progression_to_workflow_stage(text) CASCADE;
DROP FUNCTION IF EXISTS workflow_stage_label(trainee_workflow_stage) CASCADE;
DROP FUNCTION IF EXISTS rpc_transition_trainee_stage(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS rpc_get_stage_timeline(uuid) CASCADE;
DROP FUNCTION IF EXISTS rpc_get_allowed_transitions(uuid) CASCADE;

-- 5. Drop the enum type (no longer needed)
DROP TYPE IF EXISTS trainee_workflow_stage CASCADE;

-- 6. Update get_trainee_full_profile: remove workflow references
CREATE OR REPLACE FUNCTION public.get_trainee_full_profile(p_trainee_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trainee_record RECORD;
  result jsonb;
  can_view_pii boolean;
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
  dormitory_data jsonb;
  audit_logs_data jsonb;
BEGIN
  can_view_pii := public.can_view_trainee_pii();

  SELECT * INTO trainee_record
  FROM public.trainees t
  WHERE t.trainee_code = p_trainee_code;

  IF trainee_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy học viên');
  END IF;

  IF trainee_record.receiving_company_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id, 'code', c.code, 'name', c.name,
      'name_japanese', c.name_japanese, 'country', c.country,
      'address', c.address, 'work_address', c.work_address
    ) INTO company_data
    FROM public.companies c WHERE c.id = trainee_record.receiving_company_id;
  END IF;

  IF trainee_record.union_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id, 'code', u.code, 'name', u.name, 'name_japanese', u.name_japanese
    ) INTO union_data
    FROM public.unions u WHERE u.id = trainee_record.union_id;
  END IF;

  IF trainee_record.job_category_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', jc.id, 'code', jc.code, 'name', jc.name,
      'name_japanese', jc.name_japanese, 'category', jc.category
    ) INTO job_category_data
    FROM public.job_categories jc WHERE jc.id = trainee_record.job_category_id;
  END IF;

  IF trainee_record.class_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cl.id, 'code', cl.code, 'name', cl.name,
      'level', cl.level, 'status', cl.status,
      'start_date', cl.start_date, 'expected_end_date', cl.expected_end_date
    ) INTO class_data
    FROM public.classes cl WHERE cl.id = trainee_record.class_id;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ih.id, 'interview_date', ih.interview_date, 'result', ih.result,
    'expected_entry_month', ih.expected_entry_month, 'notes', ih.notes,
    'company_id', ih.company_id, 'company_name', c.name,
    'company_name_japanese', c.name_japanese, 'union_id', ih.union_id,
    'union_name', u.name, 'union_name_japanese', u.name_japanese,
    'job_category_id', ih.job_category_id, 'job_name', jc.name,
    'job_name_japanese', jc.name_japanese
  ) ORDER BY ih.interview_date DESC), '[]'::jsonb)
  INTO interview_data
  FROM public.interview_history ih
  LEFT JOIN public.companies c ON c.id = ih.company_id
  LEFT JOIN public.unions u ON u.id = ih.union_id
  LEFT JOIN public.job_categories jc ON jc.id = ih.job_category_id
  WHERE ih.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', tr.id, 'review_type', tr.review_type, 'content', tr.content,
    'rating', tr.rating, 'is_blacklisted', tr.is_blacklisted,
    'blacklist_reason', tr.blacklist_reason, 'created_at', tr.created_at
  ) ORDER BY tr.created_at DESC), '[]'::jsonb)
  INTO reviews_data
  FROM public.trainee_reviews tr WHERE tr.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ts.id, 'test_name', ts.test_name, 'test_date', ts.test_date,
    'score', ts.score, 'max_score', ts.max_score, 'notes', ts.notes,
    'evaluation', ts.evaluation, 'class_id', ts.class_id, 'class_name', cl.name
  ) ORDER BY ts.test_date DESC), '[]'::jsonb)
  INTO test_scores_data
  FROM public.test_scores ts
  LEFT JOIN public.classes cl ON cl.id = ts.class_id
  WHERE ts.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'date', a.date, 'status', a.status, 'notes', a.notes,
    'class_id', a.class_id, 'class_name', cl.name
  ) ORDER BY a.date DESC), '[]'::jsonb)
  INTO attendance_data
  FROM public.attendance a
  LEFT JOIN public.classes cl ON cl.id = a.class_id
  WHERE a.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', eh.id, 'school_name', eh.school_name, 'level', eh.level,
    'major', eh.major, 'start_year', eh.start_year, 'start_month', eh.start_month,
    'end_year', eh.end_year, 'end_month', eh.end_month
  ) ORDER BY eh.end_year DESC NULLS LAST), '[]'::jsonb)
  INTO education_data
  FROM public.education_history eh WHERE eh.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', wh.id, 'company_name', wh.company_name, 'position', wh.position,
    'start_date', wh.start_date, 'end_date', wh.end_date,
    'income', wh.income, 'responsibilities', NULL
  ) ORDER BY wh.end_date DESC NULLS LAST), '[]'::jsonb)
  INTO work_data
  FROM public.work_history wh WHERE wh.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', fm.id, 'full_name', fm.full_name, 'relationship', fm.relationship,
    'gender', fm.gender, 'birth_year', fm.birth_year, 'occupation', fm.occupation,
    'location', fm.location, 'income', fm.income, 'living_together', fm.living_together
  ) ORDER BY fm.birth_year ASC NULLS LAST), '[]'::jsonb)
  INTO family_data
  FROM public.family_members fm WHERE fm.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', jr.id, 'full_name', jr.full_name, 'relationship', jr.relationship,
    'gender', jr.gender, 'age', jr.age, 'address_japan', jr.address_japan,
    'residence_status', jr.residence_status
  )), '[]'::jsonb)
  INTO japan_relatives_data
  FROM public.japan_relatives jr WHERE jr.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', enh.id, 'action_type', enh.action_type, 'action_date', enh.action_date,
    'notes', enh.notes, 'from_class', fc.name, 'to_class', tc.name, 'class_id', enh.class_id
  ) ORDER BY enh.action_date DESC), '[]'::jsonb)
  INTO enrollment_data
  FROM public.enrollment_history enh
  LEFT JOIN public.classes fc ON fc.id = enh.from_class_id
  LEFT JOIN public.classes tc ON tc.id = enh.to_class_id
  WHERE enh.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', dr.id, 'dormitory_name', d.name, 'dormitory_address', d.address,
    'room_number', dr.room_number, 'bed_number', dr.bed_number,
    'check_in_date', dr.check_in_date, 'check_out_date', dr.check_out_date,
    'status', dr.status, 'notes', dr.notes, 'transfer_reason', dr.transfer_reason,
    'from_dormitory_name', fd.name
  ) ORDER BY dr.check_in_date DESC), '[]'::jsonb)
  INTO dormitory_data
  FROM public.dormitory_residents dr
  LEFT JOIN public.dormitories d ON d.id = dr.dormitory_id
  LEFT JOIN public.dormitories fd ON fd.id = dr.from_dormitory_id
  WHERE dr.trainee_id = trainee_record.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', al.id, 'action', al.action, 'table_name', al.table_name,
    'description', al.description, 'created_at', al.created_at
  ) ORDER BY al.created_at DESC), '[]'::jsonb)
  INTO audit_logs_data
  FROM (
    SELECT * FROM public.audit_logs
    WHERE record_id = trainee_record.id::text
    ORDER BY created_at DESC LIMIT 50
  ) al;

  -- Build result
  result := jsonb_build_object(
    'id', trainee_record.id,
    'trainee_code', trainee_record.trainee_code,
    'full_name', trainee_record.full_name,
    'furigana', trainee_record.furigana,
    'birth_date', trainee_record.birth_date,
    'gender', trainee_record.gender,
    'trainee_type', trainee_record.trainee_type::text,
    'source', trainee_record.source,
    'photo_url', trainee_record.photo_url,
    'birthplace', trainee_record.birthplace,
    'ethnicity', trainee_record.ethnicity,
    'religion', trainee_record.religion,
    'marital_status', trainee_record.marital_status,
    'education_level', trainee_record.education_level,
    'current_situation', trainee_record.current_situation,
    'policy_category', trainee_record.policy_category,
    'permanent_address', trainee_record.permanent_address,
    'current_address', trainee_record.current_address,
    'temp_address', trainee_record.temp_address,
    'household_address', trainee_record.household_address,
    'notes', trainee_record.notes,
    'line_qr_url', trainee_record.line_qr_url,
    'hearing', trainee_record.hearing,
    'hepatitis_b', trainee_record.hepatitis_b
  );

  result := result || jsonb_build_object(
    'height', trainee_record.height,
    'weight', trainee_record.weight,
    'blood_group', trainee_record.blood_group,
    'vision_left', trainee_record.vision_left,
    'vision_right', trainee_record.vision_right,
    'dominant_hand', trainee_record.dominant_hand,
    'smoking', trainee_record.smoking,
    'drinking', trainee_record.drinking,
    'tattoo', trainee_record.tattoo,
    'tattoo_description', trainee_record.tattoo_description,
    'health_status', trainee_record.health_status,
    'hobbies', trainee_record.hobbies,
    'entry_date', trainee_record.entry_date,
    'registration_date', trainee_record.registration_date,
    'interview_pass_date', trainee_record.interview_pass_date,
    'interview_count', trainee_record.interview_count,
    'document_submission_date', trainee_record.document_submission_date,
    'otit_entry_date', trainee_record.otit_entry_date,
    'nyukan_entry_date', trainee_record.nyukan_entry_date,
    'coe_date', trainee_record.coe_date,
    'visa_date', trainee_record.visa_date
  );

  result := result || jsonb_build_object(
    'departure_date', trainee_record.departure_date,
    'return_date', trainee_record.return_date,
    'expected_return_date', trainee_record.expected_return_date,
    'expected_entry_month', trainee_record.expected_entry_month,
    'contract_term', trainee_record.contract_term,
    'contract_end_date', trainee_record.contract_end_date,
    'absconded_date', trainee_record.absconded_date,
    'early_return_date', trainee_record.early_return_date,
    'early_return_reason', trainee_record.early_return_reason,
    'progression_stage', trainee_record.progression_stage::text,
    'simple_status', trainee_record.simple_status::text,
    'enrollment_status', trainee_record.enrollment_status,
    'company', COALESCE(company_data, '{}'::jsonb),
    'union', COALESCE(union_data, '{}'::jsonb),
    'job_category', COALESCE(job_category_data, '{}'::jsonb),
    'class', COALESCE(class_data, '{}'::jsonb),
    'interview_history', interview_data,
    'reviews', reviews_data,
    'test_scores', test_scores_data,
    'attendance', attendance_data,
    'education_history', education_data,
    'work_history', work_data,
    'family_members', family_data,
    'japan_relatives', japan_relatives_data,
    'enrollment_history', enrollment_data,
    'dormitory_history', dormitory_data,
    'audit_logs', audit_logs_data,
    'violations', '[]'::jsonb,
    'trainee_notes', '[]'::jsonb,
    'can_view_pii', can_view_pii
  );

  result := result || jsonb_build_object(
    'phone', CASE WHEN can_view_pii THEN trainee_record.phone ELSE NULL END,
    'zalo', CASE WHEN can_view_pii THEN trainee_record.zalo ELSE NULL END,
    'email', CASE WHEN can_view_pii THEN trainee_record.email ELSE NULL END,
    'facebook', CASE WHEN can_view_pii THEN trainee_record.facebook ELSE NULL END,
    'parent_phone_1', CASE WHEN can_view_pii THEN trainee_record.parent_phone_1 ELSE NULL END,
    'parent_phone_2', CASE WHEN can_view_pii THEN trainee_record.parent_phone_2 ELSE NULL END,
    'cccd_number', CASE WHEN can_view_pii THEN trainee_record.cccd_number ELSE NULL END,
    'cccd_date', CASE WHEN can_view_pii THEN trainee_record.cccd_date ELSE NULL END,
    'cccd_place', CASE WHEN can_view_pii THEN trainee_record.cccd_place ELSE NULL END,
    'passport_number', CASE WHEN can_view_pii THEN trainee_record.passport_number ELSE NULL END,
    'passport_date', CASE WHEN can_view_pii THEN trainee_record.passport_date ELSE NULL END
  );

  result := result || jsonb_build_object(
    'glasses', trainee_record.glasses,
    'gender_identity', trainee_record.gender_identity,
    'personality', trainee_record.personality,
    'greeting_attitude', trainee_record.greeting_attitude,
    'tidiness', trainee_record.tidiness,
    'discipline', trainee_record.discipline,
    'class_attitude', trainee_record.class_attitude,
    'rirekisho_remarks', trainee_record.rirekisho_remarks,
    'japanese_certificate', trainee_record.japanese_certificate,
    'prior_residence_status', trainee_record.prior_residence_status,
    'permanent_address_new', trainee_record.permanent_address_new,
    'high_school_name', trainee_record.high_school_name,
    'high_school_period', trainee_record.high_school_period
  );

  RETURN result;
END;
$function$;

-- 7. Update export_trainees_report: remove workflow JOIN and columns
CREATE OR REPLACE FUNCTION public.export_trainees_report(selected_columns jsonb, filters jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  sql_query text;
  column_list text;
  where_clause text := 'WHERE 1=1';
  has_pii_columns boolean := false;
  can_view_pii boolean;
  col text;
  pii_columns text[] := ARRAY['phone', 'cccd_number', 'passport_number', 'email', 'parent_phone_1', 'parent_phone_2'];
BEGIN
  IF NOT public.has_menu_permission(auth.uid(), 'reports', 'view') THEN
    RAISE EXCEPTION 'Không có quyền truy cập báo cáo';
  END IF;

  FOR col IN SELECT jsonb_array_elements_text(selected_columns)
  LOOP
    IF col = ANY(pii_columns) THEN
      has_pii_columns := true;
      EXIT;
    END IF;
  END LOOP;

  IF has_pii_columns THEN
    can_view_pii := public.can_view_trainee_pii();
    IF NOT can_view_pii THEN
      RAISE EXCEPTION 'Không có quyền xem thông tin nhạy cảm (PII)';
    END IF;
  END IF;

  SELECT string_agg(
    CASE 
      WHEN col_name = 'trainee_code' THEN 't.trainee_code'
      WHEN col_name = 'full_name' THEN 't.full_name'
      WHEN col_name = 'furigana' THEN 't.furigana'
      WHEN col_name = 'birth_date' THEN 't.birth_date'
      WHEN col_name = 'gender' THEN 't.gender'
      WHEN col_name = 'birthplace' THEN 't.birthplace'
      WHEN col_name = 'ethnicity' THEN 't.ethnicity'
      WHEN col_name = 'marital_status' THEN 't.marital_status'
      WHEN col_name = 'education_level' THEN 't.education_level'
      WHEN col_name = 'trainee_type' THEN 't.trainee_type'
      WHEN col_name = 'phone' THEN 't.phone'
      WHEN col_name = 'email' THEN 't.email'
      WHEN col_name = 'parent_phone_1' THEN 't.parent_phone_1'
      WHEN col_name = 'parent_phone_2' THEN 't.parent_phone_2'
      WHEN col_name = 'cccd_number' THEN 't.cccd_number'
      WHEN col_name = 'cccd_date' THEN 't.cccd_date'
      WHEN col_name = 'cccd_place' THEN 't.cccd_place'
      WHEN col_name = 'passport_number' THEN 't.passport_number'
      WHEN col_name = 'passport_date' THEN 't.passport_date'
      WHEN col_name = 'current_address' THEN 't.current_address'
      WHEN col_name = 'permanent_address' THEN 't.permanent_address'
      WHEN col_name = 'household_address' THEN 't.household_address'
      WHEN col_name = 'height' THEN 't.height'
      WHEN col_name = 'weight' THEN 't.weight'
      WHEN col_name = 'blood_group' THEN 't.blood_group'
      WHEN col_name = 'vision_left' THEN 't.vision_left'
      WHEN col_name = 'vision_right' THEN 't.vision_right'
      WHEN col_name = 'health_status' THEN 't.health_status'
      WHEN col_name = 'dominant_hand' THEN 't.dominant_hand'
      WHEN col_name = 'smoking' THEN 't.smoking'
      WHEN col_name = 'drinking' THEN 't.drinking'
      WHEN col_name = 'tattoo' THEN 't.tattoo'
      WHEN col_name = 'entry_date' THEN 't.entry_date'
      WHEN col_name = 'registration_date' THEN 't.registration_date'
      WHEN col_name = 'interview_pass_date' THEN 't.interview_pass_date'
      WHEN col_name = 'document_submission_date' THEN 't.document_submission_date'
      WHEN col_name = 'otit_entry_date' THEN 't.otit_entry_date'
      WHEN col_name = 'nyukan_entry_date' THEN 't.nyukan_entry_date'
      WHEN col_name = 'coe_date' THEN 't.coe_date'
      WHEN col_name = 'visa_date' THEN 't.visa_date'
      WHEN col_name = 'departure_date' THEN 't.departure_date'
      WHEN col_name = 'return_date' THEN 't.return_date'
      WHEN col_name = 'expected_return_date' THEN 't.expected_return_date'
      WHEN col_name = 'contract_end_date' THEN 't.contract_end_date'
      WHEN col_name = 'absconded_date' THEN 't.absconded_date'
      WHEN col_name = 'early_return_date' THEN 't.early_return_date'
      WHEN col_name = 'early_return_reason' THEN 't.early_return_reason'
      WHEN col_name = 'progression_stage' THEN 't.progression_stage'
      WHEN col_name = 'simple_status' THEN 't.simple_status'
      WHEN col_name = 'enrollment_status' THEN 't.enrollment_status'
      WHEN col_name = 'current_situation' THEN 't.current_situation'
      WHEN col_name = 'contract_term' THEN 't.contract_term'
      WHEN col_name = 'interview_count' THEN 't.interview_count'
      WHEN col_name = 'company_name' THEN 'c.name'
      WHEN col_name = 'company_code' THEN 'c.code'
      WHEN col_name = 'union_name' THEN 'u.name'
      WHEN col_name = 'union_code' THEN 'u.code'
      WHEN col_name = 'job_category_name' THEN 'jc.name'
      WHEN col_name = 'job_category_code' THEN 'jc.code'
      WHEN col_name = 'class_name' THEN 'cl.name'
      WHEN col_name = 'class_code' THEN 'cl.code'
      WHEN col_name = 'source' THEN 't.source'
      WHEN col_name = 'policy_category' THEN 't.policy_category'
      WHEN col_name = 'religion' THEN 't.religion'
      WHEN col_name = 'hobbies' THEN 't.hobbies'
      WHEN col_name = 'notes' THEN 't.notes'
      WHEN col_name = 'created_at' THEN 't.created_at'
      WHEN col_name = 'updated_at' THEN 't.updated_at'
      ELSE NULL
    END,
    ', '
  ) INTO column_list
  FROM jsonb_array_elements_text(selected_columns) AS col_name
  WHERE col_name IN (
    'trainee_code','full_name','furigana','birth_date','gender','birthplace',
    'ethnicity','marital_status','education_level','trainee_type',
    'phone','email','parent_phone_1','parent_phone_2',
    'cccd_number','cccd_date','cccd_place','passport_number','passport_date',
    'current_address','permanent_address','household_address',
    'height','weight','blood_group','vision_left','vision_right',
    'health_status','dominant_hand','smoking','drinking','tattoo',
    'entry_date','registration_date','interview_pass_date',
    'document_submission_date','otit_entry_date','nyukan_entry_date',
    'coe_date','visa_date','departure_date','return_date',
    'expected_return_date','contract_end_date','absconded_date',
    'early_return_date','early_return_reason',
    'progression_stage','simple_status','enrollment_status','current_situation',
    'contract_term','interview_count',
    'company_name','company_code','union_name','union_code',
    'job_category_name','job_category_code','class_name','class_code',
    'source','policy_category','religion','hobbies','notes',
    'created_at','updated_at'
  );

  IF column_list IS NULL OR column_list = '' THEN
    column_list := 't.trainee_code, t.full_name';
  END IF;

  -- Build WHERE clause from filters
  IF filters ? 'year' AND filters->>'year' IS NOT NULL AND filters->>'year' != '' THEN
    where_clause := where_clause || ' AND EXTRACT(YEAR FROM t.created_at) = ' || (filters->>'year')::int;
  END IF;
  IF filters ? 'month' AND filters->>'month' IS NOT NULL AND filters->>'month' != '' THEN
    where_clause := where_clause || ' AND EXTRACT(MONTH FROM t.created_at) = ' || (filters->>'month')::int;
  END IF;
  IF filters ? 'date_from' AND filters->>'date_from' IS NOT NULL AND filters->>'date_from' != '' THEN
    where_clause := where_clause || ' AND t.created_at >= ' || quote_literal(filters->>'date_from');
  END IF;
  IF filters ? 'date_to' AND filters->>'date_to' IS NOT NULL AND filters->>'date_to' != '' THEN
    where_clause := where_clause || ' AND t.created_at <= ' || quote_literal(filters->>'date_to');
  END IF;
  IF filters ? 'simple_status' AND filters->>'simple_status' IS NOT NULL AND filters->>'simple_status' != '' THEN
    where_clause := where_clause || ' AND t.simple_status = ' || quote_literal(filters->>'simple_status');
  END IF;
  IF filters ? 'company_id' AND filters->>'company_id' IS NOT NULL AND filters->>'company_id' != '' THEN
    where_clause := where_clause || ' AND t.receiving_company_id = ' || quote_literal(filters->>'company_id');
  END IF;
  IF filters ? 'union_id' AND filters->>'union_id' IS NOT NULL AND filters->>'union_id' != '' THEN
    where_clause := where_clause || ' AND t.union_id = ' || quote_literal(filters->>'union_id');
  END IF;
  IF filters ? 'job_category_id' AND filters->>'job_category_id' IS NOT NULL AND filters->>'job_category_id' != '' THEN
    where_clause := where_clause || ' AND t.job_category_id = ' || quote_literal(filters->>'job_category_id');
  END IF;
  IF filters ? 'trainee_type' AND filters->>'trainee_type' IS NOT NULL AND filters->>'trainee_type' != '' THEN
    where_clause := where_clause || ' AND t.trainee_type = ' || quote_literal(filters->>'trainee_type');
  END IF;
  IF filters ? 'gender' AND filters->>'gender' IS NOT NULL AND filters->>'gender' != '' THEN
    where_clause := where_clause || ' AND t.gender = ' || quote_literal(filters->>'gender');
  END IF;
  IF filters ? 'departure_from' AND filters->>'departure_from' IS NOT NULL AND filters->>'departure_from' != '' THEN
    where_clause := where_clause || ' AND t.departure_date >= ' || quote_literal(filters->>'departure_from');
  END IF;
  IF filters ? 'departure_to' AND filters->>'departure_to' IS NOT NULL AND filters->>'departure_to' != '' THEN
    where_clause := where_clause || ' AND t.departure_date <= ' || quote_literal(filters->>'departure_to');
  END IF;
  IF filters ? 'interview_pass_from' AND filters->>'interview_pass_from' IS NOT NULL AND filters->>'interview_pass_from' != '' THEN
    where_clause := where_clause || ' AND t.interview_pass_date >= ' || quote_literal(filters->>'interview_pass_from');
  END IF;
  IF filters ? 'interview_pass_to' AND filters->>'interview_pass_to' IS NOT NULL AND filters->>'interview_pass_to' != '' THEN
    where_clause := where_clause || ' AND t.interview_pass_date <= ' || quote_literal(filters->>'interview_pass_to');
  END IF;
  -- Progression stage filter (replaces workflow current_stage filter)
  IF filters ? 'progression_stage' AND filters->>'progression_stage' IS NOT NULL AND filters->>'progression_stage' != '' THEN
    where_clause := where_clause || ' AND t.progression_stage = ' || quote_literal(filters->>'progression_stage');
  END IF;

  sql_query := format(
    'SELECT jsonb_agg(row_to_json(subq)) FROM (
      SELECT %s
      FROM trainees t
      LEFT JOIN companies c ON t.receiving_company_id = c.id
      LEFT JOIN unions u ON t.union_id = u.id
      LEFT JOIN job_categories jc ON t.job_category_id = jc.id
      LEFT JOIN classes cl ON t.class_id = cl.id
      %s
      ORDER BY t.created_at DESC
      LIMIT 10000
    ) subq',
    column_list,
    where_clause
  );

  EXECUTE sql_query INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
