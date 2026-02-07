-- =============================================
-- SECURITY FIX Part 2: Convert remaining views to SECURITY INVOKER
-- and fix function search paths
-- =============================================

-- ============================================
-- PART A: Fix remaining views (14 views)
-- ============================================

-- 1. dormitory_gender_stats
DROP VIEW IF EXISTS public.dormitory_gender_stats;
CREATE VIEW public.dormitory_gender_stats WITH (security_invoker = true) AS
SELECT count(DISTINCT dr.trainee_id) AS total_residents,
  count(DISTINCT CASE WHEN (t.gender = 'Nam'::text) THEN dr.trainee_id ELSE NULL::uuid END) AS male_count,
  count(DISTINCT CASE WHEN (t.gender = 'Nữ'::text) THEN dr.trainee_id ELSE NULL::uuid END) AS female_count
FROM (dormitory_residents dr JOIN trainees t ON ((t.id = dr.trainee_id)))
WHERE ((dr.status = 'Đang ở'::text) AND (t.simple_status = ANY (ARRAY['Đang học'::simple_status, 'Đăng ký mới'::simple_status])));

-- 2. education_interview_stats
DROP VIEW IF EXISTS public.education_interview_stats;
CREATE VIEW public.education_interview_stats WITH (security_invoker = true) AS
WITH valid_classes AS (
  SELECT classes.id FROM classes
), trainees_in_classes AS (
  SELECT t.id, t.gender, t.class_id, t.progression_stage
  FROM trainees t
  WHERE ((t.class_id IS NOT NULL) AND (t.class_id IN (SELECT valid_classes.id FROM valid_classes)) 
    AND (t.departure_date IS NULL) 
    AND ((t.progression_stage IS NULL) OR ((t.progression_stage)::text <> ALL (ARRAY['Xuất cảnh'::text, 'Đang làm việc'::text, 'Bỏ trốn'::text, 'Về trước hạn'::text, 'Hoàn thành hợp đồng'::text]))))
)
SELECT (count(*) FILTER (WHERE ((progression_stage IS NOT NULL) AND (gender = 'Nam'::text))))::integer AS passed_male,
  (count(*) FILTER (WHERE ((progression_stage IS NOT NULL) AND (gender = 'Nữ'::text))))::integer AS passed_female,
  (count(*) FILTER (WHERE (progression_stage IS NOT NULL)))::integer AS passed_total,
  (count(*) FILTER (WHERE ((progression_stage IS NULL) AND (gender = 'Nam'::text))))::integer AS not_passed_male,
  (count(*) FILTER (WHERE ((progression_stage IS NULL) AND (gender = 'Nữ'::text))))::integer AS not_passed_female,
  (count(*) FILTER (WHERE (progression_stage IS NULL)))::integer AS not_passed_total
FROM trainees_in_classes;

-- 3. education_stats
DROP VIEW IF EXISTS public.education_stats;
CREATE VIEW public.education_stats WITH (security_invoker = true) AS
SELECT ((SELECT count(*) FROM teachers))::integer AS total_teachers,
  ((SELECT count(*) FROM teachers WHERE (teachers.status = 'Đang làm việc'::text)))::integer AS active_teachers,
  ((SELECT count(*) FROM classes))::integer AS total_classes,
  ((SELECT count(*) FROM classes WHERE (classes.status = 'Đang hoạt động'::text)))::integer AS active_classes;

-- 4. legal_company_stats
DROP VIEW IF EXISTS public.legal_company_stats;
CREATE VIEW public.legal_company_stats WITH (security_invoker = true) AS
SELECT t.receiving_company_id AS company_id,
  c.code, c.name, c.name_japanese, c.address, c.work_address,
  u.name AS union_name, jc.name AS job_category_name, t.interview_pass_date,
  count(*) FILTER (WHERE (COALESCE(t.document_status, 'not_started'::text) = 'not_started'::text)) AS docs_not_started,
  count(*) FILTER (WHERE (t.document_status = 'in_progress'::text)) AS docs_in_progress,
  count(*) FILTER (WHERE (t.document_status = 'completed'::text)) AS docs_completed,
  count(*) AS total_passed
FROM (((trainees t JOIN companies c ON ((t.receiving_company_id = c.id)))
  LEFT JOIN unions u ON ((t.union_id = u.id)))
  LEFT JOIN job_categories jc ON ((t.job_category_id = jc.id)))
WHERE ((t.interview_pass_date IS NOT NULL) AND (t.receiving_company_id IS NOT NULL) AND (t.progression_stage = 'Đậu phỏng vấn'::progression_stage))
GROUP BY t.receiving_company_id, c.code, c.name, c.name_japanese, c.address, c.work_address, u.name, jc.name, t.interview_pass_date;

-- 5. legal_summary_stats
DROP VIEW IF EXISTS public.legal_summary_stats;
CREATE VIEW public.legal_summary_stats WITH (security_invoker = true) AS
SELECT count(DISTINCT receiving_company_id) AS total_companies,
  count(*) AS total_all,
  count(*) FILTER (WHERE (COALESCE(document_status, 'not_started'::text) = 'not_started'::text)) AS docs_not_started,
  count(*) FILTER (WHERE (document_status = 'in_progress'::text)) AS docs_in_progress,
  count(*) FILTER (WHERE (document_status = 'completed'::text)) AS docs_completed,
  (0)::bigint AS total_paperwork,
  (0)::bigint AS total_departed
FROM trainees t
WHERE ((interview_pass_date IS NOT NULL) AND (receiving_company_id IS NOT NULL) AND (progression_stage = 'Đậu phỏng vấn'::progression_stage));

-- 6. legal_trainee_type_stats
DROP VIEW IF EXISTS public.legal_trainee_type_stats;
CREATE VIEW public.legal_trainee_type_stats WITH (security_invoker = true) AS
SELECT trainee_type,
  count(*) AS count,
  count(*) FILTER (WHERE (gender = 'Nam'::text)) AS male_count,
  count(*) FILTER (WHERE (gender = 'Nữ'::text)) AS female_count
FROM trainees t
WHERE ((interview_pass_date IS NOT NULL) AND (receiving_company_id IS NOT NULL) AND (progression_stage = 'Đậu phỏng vấn'::progression_stage))
GROUP BY trainee_type;

-- 7. order_stats
DROP VIEW IF EXISTS public.order_stats;
CREATE VIEW public.order_stats WITH (security_invoker = true) AS
SELECT (count(*))::integer AS total,
  (count(*) FILTER (WHERE (status = 'Đang tuyển'::text)))::integer AS recruiting,
  (count(*) FILTER (WHERE (status = 'Đã đủ form'::text)))::integer AS form_complete,
  (count(*) FILTER (WHERE (status = 'Đã phỏng vấn'::text)))::integer AS interviewed,
  (count(*) FILTER (WHERE (status = 'Hoàn thành'::text)))::integer AS completed,
  (count(*) FILTER (WHERE (status = 'Hủy'::text)))::integer AS cancelled
FROM orders;

-- 8. post_departure_by_type
DROP VIEW IF EXISTS public.post_departure_by_type;
CREATE VIEW public.post_departure_by_type WITH (security_invoker = true) AS
SELECT trainee_type,
  (EXTRACT(year FROM departure_date))::text AS departure_year,
  (count(*))::integer AS count
FROM trainees t
WHERE ((progression_stage = ANY (ARRAY['Xuất cảnh'::progression_stage, 'Đang làm việc'::progression_stage, 'Hoàn thành hợp đồng'::progression_stage, 'Bỏ trốn'::progression_stage, 'Về trước hạn'::progression_stage])) AND (departure_date IS NOT NULL))
GROUP BY trainee_type, (EXTRACT(year FROM departure_date))
ORDER BY (EXTRACT(year FROM departure_date))::text DESC, ((count(*))::integer) DESC;

-- 9. post_departure_by_type_summary
DROP VIEW IF EXISTS public.post_departure_by_type_summary;
CREATE VIEW public.post_departure_by_type_summary WITH (security_invoker = true) AS
SELECT trainee_type,
  (count(*))::integer AS count
FROM trainees
WHERE ((progression_stage = ANY (ARRAY['Xuất cảnh'::progression_stage, 'Đang làm việc'::progression_stage, 'Hoàn thành hợp đồng'::progression_stage, 'Bỏ trốn'::progression_stage, 'Về trước hạn'::progression_stage])) AND (departure_date IS NOT NULL))
GROUP BY trainee_type
ORDER BY ((count(*))::integer) DESC;

-- 10. post_departure_stats_by_year
DROP VIEW IF EXISTS public.post_departure_stats_by_year;
CREATE VIEW public.post_departure_stats_by_year WITH (security_invoker = true) AS
SELECT (EXTRACT(year FROM departure_date))::text AS year,
  (count(*) FILTER (WHERE (progression_stage = ANY (ARRAY['Đang làm việc'::progression_stage, 'Xuất cảnh'::progression_stage]))))::integer AS working,
  (count(*) FILTER (WHERE (progression_stage = 'Về trước hạn'::progression_stage)))::integer AS early_return,
  (count(*) FILTER (WHERE (progression_stage = 'Bỏ trốn'::progression_stage)))::integer AS absconded,
  (count(*) FILTER (WHERE (progression_stage = 'Hoàn thành hợp đồng'::progression_stage)))::integer AS completed,
  (count(*))::integer AS total
FROM trainees
WHERE (departure_date IS NOT NULL)
GROUP BY (EXTRACT(year FROM departure_date))
ORDER BY (EXTRACT(year FROM departure_date))::text;

-- 11. post_departure_summary
DROP VIEW IF EXISTS public.post_departure_summary;
CREATE VIEW public.post_departure_summary WITH (security_invoker = true) AS
SELECT (count(*) FILTER (WHERE (progression_stage = ANY (ARRAY['Đang làm việc'::progression_stage, 'Xuất cảnh'::progression_stage]))))::integer AS working,
  (count(*) FILTER (WHERE (progression_stage = 'Về trước hạn'::progression_stage)))::integer AS early_return,
  (count(*) FILTER (WHERE (progression_stage = 'Bỏ trốn'::progression_stage)))::integer AS absconded,
  (count(*) FILTER (WHERE (progression_stage = 'Hoàn thành hợp đồng'::progression_stage)))::integer AS completed,
  (count(*))::integer AS total
FROM trainees
WHERE (departure_date IS NOT NULL);

-- 12. trainee_stage_counts
DROP VIEW IF EXISTS public.trainee_stage_counts;
CREATE VIEW public.trainee_stage_counts WITH (security_invoker = true) AS
SELECT COALESCE((trainees.progression_stage)::text, 'Chưa đậu'::text) AS stage,
  (count(*))::integer AS count
FROM trainees
GROUP BY COALESCE((trainees.progression_stage)::text, 'Chưa đậu'::text)
UNION ALL
SELECT 'all'::text AS stage,
  (count(*))::integer AS count
FROM trainees;

-- 13. union_stats
DROP VIEW IF EXISTS public.union_stats;
CREATE VIEW public.union_stats WITH (security_invoker = true) AS
SELECT ((SELECT count(*) FROM union_members WHERE ((union_members.status)::text = 'Đang tham gia'::text)))::integer AS active_members,
  ((SELECT count(*) FROM union_members))::integer AS total_members,
  COALESCE((SELECT sum(union_transactions.amount) FROM union_transactions WHERE ((union_transactions.transaction_type)::text = 'Thu'::text)), (0)::numeric) AS total_income,
  COALESCE((SELECT sum(union_transactions.amount) FROM union_transactions WHERE ((union_transactions.transaction_type)::text = 'Chi'::text)), (0)::numeric) AS total_expense,
  (COALESCE((SELECT sum(union_transactions.amount) FROM union_transactions WHERE ((union_transactions.transaction_type)::text = 'Thu'::text)), (0)::numeric) 
   - COALESCE((SELECT sum(union_transactions.amount) FROM union_transactions WHERE ((union_transactions.transaction_type)::text = 'Chi'::text)), (0)::numeric)) AS balance;

-- 14. v_trainee_interview_count
DROP VIEW IF EXISTS public.v_trainee_interview_count;
CREATE VIEW public.v_trainee_interview_count WITH (security_invoker = true) AS
SELECT trainee_id, count(*) AS interview_count
FROM interview_history
GROUP BY trainee_id;

-- 15. v_trainees_registered_monthly
DROP VIEW IF EXISTS public.v_trainees_registered_monthly;
CREATE VIEW public.v_trainees_registered_monthly WITH (security_invoker = true) AS
SELECT (EXTRACT(year FROM registration_date))::integer AS year,
  (EXTRACT(month FROM registration_date))::integer AS month,
  to_char((registration_date)::timestamp with time zone, 'YYYY-MM'::text) AS year_month,
  (count(*))::integer AS total_registered
FROM trainees
WHERE (registration_date IS NOT NULL)
GROUP BY (EXTRACT(year FROM registration_date)), (EXTRACT(month FROM registration_date)), (to_char((registration_date)::timestamp with time zone, 'YYYY-MM'::text))
ORDER BY ((EXTRACT(year FROM registration_date))::integer) DESC, ((EXTRACT(month FROM registration_date))::integer) DESC;

-- ============================================
-- PART B: Fix function search paths
-- ============================================

-- Fix get_trainee_full_profile - add SET search_path = public
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
  workflow_history_data jsonb;
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

  -- Current workflow state
  SELECT jsonb_build_object(
    'current_stage', tw.current_stage,
    'sub_status', tw.sub_status,
    'transitioned_at', tw.transitioned_at
  )
  INTO workflow_data
  FROM public.trainee_workflow tw
  WHERE tw.trainee_id = trainee_record.id;

  -- Workflow history (stage transitions)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', twh.id,
        'from_stage', twh.from_stage,
        'to_stage', twh.to_stage,
        'sub_status', twh.sub_status,
        'reason', twh.reason,
        'changed_by', twh.changed_by,
        'created_at', twh.created_at,
        'department_name', d.name
      )
      ORDER BY twh.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO workflow_history_data
  FROM public.trainee_workflow_history twh
  LEFT JOIN public.departments d ON d.id = twh.owner_department_id
  WHERE twh.trainee_id = trainee_record.id;

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
        'company_id', ih.company_id,
        'company_name', c.name,
        'company_name_japanese', c.name_japanese,
        'union_id', ih.union_id,
        'union_name', u.name,
        'union_name_japanese', u.name_japanese,
        'job_category_id', ih.job_category_id,
        'job_name', jc.name,
        'job_name_japanese', jc.name_japanese
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
        'review_type', tr.review_type,
        'content', tr.content,
        'rating', tr.rating,
        'is_blacklisted', tr.is_blacklisted,
        'blacklist_reason', tr.blacklist_reason,
        'created_at', tr.created_at
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
        'test_name', ts.test_name,
        'test_date', ts.test_date,
        'score', ts.score,
        'max_score', ts.max_score,
        'notes', ts.notes,
        'evaluation', ts.evaluation,
        'class_id', ts.class_id,
        'class_name', cl.name
      )
      ORDER BY ts.test_date DESC
    ),
    '[]'::jsonb
  )
  INTO test_scores_data
  FROM public.test_scores ts
  LEFT JOIN public.classes cl ON cl.id = ts.class_id
  WHERE ts.trainee_id = trainee_record.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'date', a.date,
        'status', a.status,
        'notes', a.notes,
        'class_id', a.class_id,
        'class_name', cl.name
      )
      ORDER BY a.date DESC
    ),
    '[]'::jsonb
  )
  INTO attendance_data
  FROM public.attendance a
  LEFT JOIN public.classes cl ON cl.id = a.class_id
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
        'end_date', wh.end_date,
        'responsibilities', NULL
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
        'to_class', tc.name,
        'class_id', enh.class_id
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', dr.id,
        'dormitory_name', d.name,
        'dormitory_address', d.address,
        'room_number', dr.room_number,
        'bed_number', dr.bed_number,
        'check_in_date', dr.check_in_date,
        'check_out_date', dr.check_out_date,
        'status', dr.status,
        'notes', dr.notes,
        'transfer_reason', dr.transfer_reason,
        'from_dormitory_name', fd.name
      )
      ORDER BY dr.check_in_date DESC
    ),
    '[]'::jsonb
  )
  INTO dormitory_data
  FROM public.dormitory_residents dr
  LEFT JOIN public.dormitories d ON d.id = dr.dormitory_id
  LEFT JOIN public.dormitories fd ON fd.id = dr.from_dormitory_id
  WHERE dr.trainee_id = trainee_record.id;

  -- Audit logs for this trainee (limited to last 50)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', al.id,
        'action', al.action,
        'table_name', al.table_name,
        'description', al.description,
        'created_at', al.created_at
      )
      ORDER BY al.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO audit_logs_data
  FROM (
    SELECT * FROM public.audit_logs
    WHERE record_id = trainee_record.id::text
    ORDER BY created_at DESC
    LIMIT 50
  ) al;

  -- Build result in chunks to avoid Postgres 100-arg limit
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
    'workflow', COALESCE(workflow_data, '{}'::jsonb),
    'workflow_history', workflow_history_data,
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

  RETURN result;
END;
$function$;

-- Grant SELECT on all new views to authenticated users
GRANT SELECT ON public.dormitory_gender_stats TO authenticated;
GRANT SELECT ON public.education_interview_stats TO authenticated;
GRANT SELECT ON public.education_stats TO authenticated;
GRANT SELECT ON public.legal_company_stats TO authenticated;
GRANT SELECT ON public.legal_summary_stats TO authenticated;
GRANT SELECT ON public.legal_trainee_type_stats TO authenticated;
GRANT SELECT ON public.order_stats TO authenticated;
GRANT SELECT ON public.post_departure_by_type TO authenticated;
GRANT SELECT ON public.post_departure_by_type_summary TO authenticated;
GRANT SELECT ON public.post_departure_stats_by_year TO authenticated;
GRANT SELECT ON public.post_departure_summary TO authenticated;
GRANT SELECT ON public.trainee_stage_counts TO authenticated;
GRANT SELECT ON public.union_stats TO authenticated;
GRANT SELECT ON public.v_trainee_interview_count TO authenticated;
GRANT SELECT ON public.v_trainees_registered_monthly TO authenticated;