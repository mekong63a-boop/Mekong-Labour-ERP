-- =============================================
-- SECURITY FIX: Convert all views to SECURITY INVOKER
-- =============================================
-- This migration converts dashboard views from implicit SECURITY DEFINER
-- to SECURITY INVOKER so they respect RLS policies of the querying user.
-- 
-- Impact: Admin users see all data. Restricted users only see their allowed data.
-- =============================================

-- 1. dashboard_available_years
DROP VIEW IF EXISTS public.dashboard_available_years;
CREATE VIEW public.dashboard_available_years WITH (security_invoker = true) AS
SELECT DISTINCT year
FROM (
  SELECT EXTRACT(year FROM trainees.registration_date) AS year FROM trainees WHERE (trainees.registration_date IS NOT NULL)
  UNION
  SELECT EXTRACT(year FROM trainees.departure_date) AS year FROM trainees WHERE (trainees.departure_date IS NOT NULL)
  UNION
  SELECT EXTRACT(year FROM trainees.interview_pass_date) AS year FROM trainees WHERE (trainees.interview_pass_date IS NOT NULL)
  UNION
  SELECT EXTRACT(year FROM trainees.created_at) AS year FROM trainees WHERE (trainees.created_at IS NOT NULL)
) all_years
WHERE (year IS NOT NULL)
ORDER BY year DESC;

-- 2. dashboard_monthly_combined
DROP VIEW IF EXISTS public.dashboard_monthly_combined;
CREATE VIEW public.dashboard_monthly_combined WITH (security_invoker = true) AS
WITH registration_months AS (
  SELECT (date_trunc('month'::text, (trainees.registration_date)::timestamp with time zone))::date AS month_date,
    to_char((trainees.registration_date)::timestamp with time zone, 'MM/YYYY'::text) AS month_label,
    count(*) AS recruitment
  FROM trainees
  WHERE (trainees.registration_date IS NOT NULL)
  GROUP BY (date_trunc('month'::text, (trainees.registration_date)::timestamp with time zone)), (to_char((trainees.registration_date)::timestamp with time zone, 'MM/YYYY'::text))
), departure_months AS (
  SELECT (date_trunc('month'::text, (trainees.departure_date)::timestamp with time zone))::date AS month_date,
    to_char((trainees.departure_date)::timestamp with time zone, 'MM/YYYY'::text) AS month_label,
    count(*) AS departure
  FROM trainees
  WHERE (trainees.departure_date IS NOT NULL)
  GROUP BY (date_trunc('month'::text, (trainees.departure_date)::timestamp with time zone)), (to_char((trainees.departure_date)::timestamp with time zone, 'MM/YYYY'::text))
), all_months AS (
  SELECT registration_months.month_date, registration_months.month_label FROM registration_months
  UNION
  SELECT departure_months.month_date, departure_months.month_label FROM departure_months
)
SELECT am.month_date,
  am.month_label,
  (COALESCE(rm.recruitment, (0)::bigint))::integer AS recruitment,
  (COALESCE(dm.departure, (0)::bigint))::integer AS departure
FROM ((all_months am
  LEFT JOIN registration_months rm ON ((am.month_date = rm.month_date)))
  LEFT JOIN departure_months dm ON ((am.month_date = dm.month_date)))
ORDER BY am.month_date;

-- 3. dashboard_monthly_passed
DROP VIEW IF EXISTS public.dashboard_monthly_passed;
CREATE VIEW public.dashboard_monthly_passed WITH (security_invoker = true) AS
SELECT date_trunc('month'::text, (interview_pass_date)::timestamp with time zone) AS month_date,
  to_char(date_trunc('month'::text, (interview_pass_date)::timestamp with time zone), 'MM/YYYY'::text) AS month_label,
  (count(*))::integer AS passed_count
FROM trainees t
WHERE ((interview_pass_date IS NOT NULL) AND (progression_stage IS NOT NULL) AND (progression_stage <> 'Chưa đậu'::progression_stage))
GROUP BY (date_trunc('month'::text, (interview_pass_date)::timestamp with time zone)), (to_char(date_trunc('month'::text, (interview_pass_date)::timestamp with time zone), 'MM/YYYY'::text))
ORDER BY (date_trunc('month'::text, (interview_pass_date)::timestamp with time zone));

-- 4. dashboard_trainee_by_birthplace
DROP VIEW IF EXISTS public.dashboard_trainee_by_birthplace;
CREATE VIEW public.dashboard_trainee_by_birthplace WITH (security_invoker = true) AS
SELECT COALESCE(birthplace, 'Chưa xác định'::text) AS birthplace,
  count(*) AS count
FROM trainees
GROUP BY birthplace
ORDER BY (count(*)) DESC
LIMIT 10;

-- 5. dashboard_trainee_by_company
DROP VIEW IF EXISTS public.dashboard_trainee_by_company;
CREATE VIEW public.dashboard_trainee_by_company WITH (security_invoker = true) AS
SELECT c.id AS company_id,
  c.name AS company_name,
  (EXTRACT(year FROM COALESCE((t.interview_pass_date)::timestamp with time zone, t.created_at)))::integer AS year,
  (count(*))::integer AS count
FROM (trainees t
  JOIN companies c ON ((c.id = t.receiving_company_id)))
WHERE (t.progression_stage = ANY (ARRAY['Đậu phỏng vấn'::progression_stage, 'Nộp hồ sơ'::progression_stage, 'OTIT'::progression_stage, 'Nyukan'::progression_stage, 'COE'::progression_stage, 'Visa'::progression_stage, 'Xuất cảnh'::progression_stage, 'Đang làm việc'::progression_stage, 'Hoàn thành hợp đồng'::progression_stage]))
GROUP BY c.id, c.name, (EXTRACT(year FROM COALESCE((t.interview_pass_date)::timestamp with time zone, t.created_at)))
ORDER BY ((EXTRACT(year FROM COALESCE((t.interview_pass_date)::timestamp with time zone, t.created_at)))::integer) DESC, ((count(*))::integer) DESC;

-- 6. dashboard_trainee_by_gender
DROP VIEW IF EXISTS public.dashboard_trainee_by_gender;
CREATE VIEW public.dashboard_trainee_by_gender WITH (security_invoker = true) AS
SELECT COALESCE(gender, 'Chưa xác định'::text) AS gender,
  count(*) AS count
FROM trainees
GROUP BY gender
ORDER BY (count(*)) DESC;

-- 7. dashboard_trainee_by_source
DROP VIEW IF EXISTS public.dashboard_trainee_by_source;
CREATE VIEW public.dashboard_trainee_by_source WITH (security_invoker = true) AS
SELECT COALESCE(source, 'Chưa xác định'::text) AS source,
  count(*) AS count
FROM trainees
GROUP BY source
ORDER BY (count(*)) DESC
LIMIT 10;

-- 8. dashboard_trainee_by_stage
DROP VIEW IF EXISTS public.dashboard_trainee_by_stage;
CREATE VIEW public.dashboard_trainee_by_stage WITH (security_invoker = true) AS
SELECT (tw.current_stage)::text AS stage,
  workflow_stage_label(tw.current_stage) AS stage_label,
  count(*) AS count
FROM (trainees t
  LEFT JOIN trainee_workflow tw ON ((t.id = tw.trainee_id)))
GROUP BY tw.current_stage
ORDER BY (count(*)) DESC;

-- 9. dashboard_trainee_by_type
DROP VIEW IF EXISTS public.dashboard_trainee_by_type;
CREATE VIEW public.dashboard_trainee_by_type WITH (security_invoker = true) AS
SELECT COALESCE((trainee_type)::text, 'Chưa xác định'::text) AS trainee_type,
  count(*) AS count
FROM trainees
GROUP BY trainee_type
ORDER BY (count(*)) DESC;

-- 10. dashboard_trainee_departures_monthly
DROP VIEW IF EXISTS public.dashboard_trainee_departures_monthly;
CREATE VIEW public.dashboard_trainee_departures_monthly WITH (security_invoker = true) AS
SELECT to_char((months.month_date)::timestamp with time zone, 'MM/YYYY'::text) AS month_label,
  months.month_date,
  COALESCE(t.departures, (0)::bigint) AS departures
FROM (( SELECT (generate_series((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval), date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone), '1 mon'::interval))::date AS month_date) months
  LEFT JOIN ( SELECT (date_trunc('month'::text, (trainees.departure_date)::timestamp with time zone))::date AS dep_month,
    count(*) AS departures
  FROM trainees
  WHERE (trainees.departure_date >= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval))
  GROUP BY (date_trunc('month'::text, (trainees.departure_date)::timestamp with time zone))) t ON ((months.month_date = t.dep_month)))
ORDER BY months.month_date;

-- 11. dashboard_trainee_kpis
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;
CREATE VIEW public.dashboard_trainee_kpis WITH (security_invoker = true) AS
WITH valid_classes AS (
  SELECT classes.id FROM classes WHERE (classes.status = 'Đang hoạt động'::text)
), departed_stages AS (
  SELECT unnest(ARRAY['Xuất cảnh'::progression_stage, 'Đang làm việc'::progression_stage, 'Bỏ trốn'::progression_stage, 'Về trước hạn'::progression_stage, 'Hoàn thành hợp đồng'::progression_stage]) AS stage
)
SELECT (count(*))::integer AS total_trainees,
  (count(*) FILTER (WHERE (gender = 'Nam'::text)))::integer AS total_male,
  (count(*) FILTER (WHERE (gender = 'Nữ'::text)))::integer AS total_female,
  (count(*) FILTER (WHERE ((class_id IS NOT NULL) AND (class_id IN ( SELECT valid_classes.id FROM valid_classes)) AND (departure_date IS NULL) AND ((progression_stage IS NULL) OR (NOT (progression_stage IN ( SELECT departed_stages.stage FROM departed_stages)))))))::integer AS status_studying,
  (count(*) FILTER (WHERE ((class_id IS NOT NULL) AND (class_id IN ( SELECT valid_classes.id FROM valid_classes)) AND (departure_date IS NULL) AND ((progression_stage IS NULL) OR (NOT (progression_stage IN ( SELECT departed_stages.stage FROM departed_stages)))) AND (gender = 'Nam'::text))))::integer AS studying_male,
  (count(*) FILTER (WHERE ((class_id IS NOT NULL) AND (class_id IN ( SELECT valid_classes.id FROM valid_classes)) AND (departure_date IS NULL) AND ((progression_stage IS NULL) OR (NOT (progression_stage IN ( SELECT departed_stages.stage FROM departed_stages)))) AND (gender = 'Nữ'::text))))::integer AS studying_female,
  (count(*) FILTER (WHERE (date_trunc('year'::text, (departure_date)::timestamp with time zone) = date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS departed_this_year,
  (count(*) FILTER (WHERE ((date_trunc('year'::text, (departure_date)::timestamp with time zone) = date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone)) AND (gender = 'Nam'::text))))::integer AS departed_male,
  (count(*) FILTER (WHERE ((date_trunc('year'::text, (departure_date)::timestamp with time zone) = date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone)) AND (gender = 'Nữ'::text))))::integer AS departed_female,
  (count(*) FILTER (WHERE ((progression_stage IS NULL) OR (progression_stage = 'Chưa đậu'::progression_stage))))::integer AS stage_recruited,
  (count(*) FILTER (WHERE (progression_stage = ANY (ARRAY['Đậu phỏng vấn'::progression_stage, 'Nộp hồ sơ'::progression_stage, 'OTIT'::progression_stage, 'Nyukan'::progression_stage, 'COE'::progression_stage]))))::integer AS stage_visa_processing,
  (count(*) FILTER (WHERE (progression_stage = 'Visa'::progression_stage)))::integer AS stage_ready_to_depart,
  (count(*) FILTER (WHERE (progression_stage = 'Xuất cảnh'::progression_stage)))::integer AS stage_departed,
  (count(*) FILTER (WHERE (progression_stage = 'Đang làm việc'::progression_stage)))::integer AS stage_in_japan,
  (count(*) FILTER (WHERE (progression_stage = ANY (ARRAY['Bỏ trốn'::progression_stage, 'Về trước hạn'::progression_stage, 'Hoàn thành hợp đồng'::progression_stage]))))::integer AS stage_archived,
  (count(*) FILTER (WHERE (progression_stage = 'Đang làm việc'::progression_stage)))::integer AS stage_post_departure,
  (count(*) FILTER (WHERE (trainee_type = 'Thực tập sinh'::trainee_type)))::integer AS type_tts,
  (count(*) FILTER (WHERE (trainee_type = 'Kỹ năng đặc định'::trainee_type)))::integer AS type_knd,
  (count(*) FILTER (WHERE (trainee_type = 'Kỹ sư'::trainee_type)))::integer AS type_engineer,
  (count(*) FILTER (WHERE (trainee_type = 'Du học sinh'::trainee_type)))::integer AS type_student,
  (count(*) FILTER (WHERE (trainee_type = 'Thực tập sinh số 3'::trainee_type)))::integer AS type_tts3,
  (count(*) FILTER (WHERE (date_trunc('month'::text, (registration_date)::timestamp with time zone) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS registered_this_month,
  (count(*) FILTER (WHERE (date_trunc('year'::text, (registration_date)::timestamp with time zone) = date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS registered_this_year,
  (count(*) FILTER (WHERE (date_trunc('month'::text, (departure_date)::timestamp with time zone) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS departed_this_month,
  ( SELECT (count(*))::integer AS count FROM orders WHERE (orders.status = 'Đang tuyển'::text)) AS active_orders
FROM trainees;

-- 12. dashboard_trainee_monthly
DROP VIEW IF EXISTS public.dashboard_trainee_monthly;
CREATE VIEW public.dashboard_trainee_monthly WITH (security_invoker = true) AS
SELECT to_char((months.month_date)::timestamp with time zone, 'MM/YYYY'::text) AS month_label,
  months.month_date,
  COALESCE(t.registrations, (0)::bigint) AS registrations
FROM (( SELECT (generate_series((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval), date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone), '1 mon'::interval))::date AS month_date) months
  LEFT JOIN ( SELECT (date_trunc('month'::text, (trainees.registration_date)::timestamp with time zone))::date AS reg_month,
    count(*) AS registrations
  FROM trainees
  WHERE (trainees.registration_date >= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval))
  GROUP BY (date_trunc('month'::text, (trainees.registration_date)::timestamp with time zone))) t ON ((months.month_date = t.reg_month)))
ORDER BY months.month_date;

-- 13. dashboard_trainee_passed_monthly
DROP VIEW IF EXISTS public.dashboard_trainee_passed_monthly;
CREATE VIEW public.dashboard_trainee_passed_monthly WITH (security_invoker = true) AS
SELECT to_char((months.month_date)::timestamp with time zone, 'MM/YYYY'::text) AS month_label,
  months.month_date,
  COALESCE(t.passed_count, (0)::bigint) AS passed_count
FROM (( SELECT (generate_series((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval), date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone), '1 mon'::interval))::date AS month_date) months
  LEFT JOIN ( SELECT (date_trunc('month'::text, (trainees.interview_pass_date)::timestamp with time zone))::date AS pass_month,
    count(*) AS passed_count
  FROM trainees
  WHERE (trainees.interview_pass_date >= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '11 mons'::interval))
  GROUP BY (date_trunc('month'::text, (trainees.interview_pass_date)::timestamp with time zone))) t ON ((months.month_date = t.pass_month)))
ORDER BY months.month_date;

-- 14. companies_public
DROP VIEW IF EXISTS public.companies_public;
CREATE VIEW public.companies_public WITH (security_invoker = true) AS
SELECT id, code, name, name_japanese, country, status, created_at, updated_at
FROM companies;

-- 15. teachers_public
DROP VIEW IF EXISTS public.teachers_public;
CREATE VIEW public.teachers_public WITH (security_invoker = true) AS
SELECT id, code, full_name, specialty, status, class_start_date, class_end_date, created_at, updated_at
FROM teachers;

-- 16. dormitories_with_occupancy
DROP VIEW IF EXISTS public.dormitories_with_occupancy;
CREATE VIEW public.dormitories_with_occupancy WITH (security_invoker = true) AS
SELECT id, name, address, capacity, status, notes, created_at, updated_at,
  (COALESCE(( SELECT count(DISTINCT dr.trainee_id) AS count
    FROM (dormitory_residents dr
      JOIN trainees t ON ((t.id = dr.trainee_id)))
    WHERE ((dr.dormitory_id = d.id) AND (dr.status = 'Đang ở'::text) AND (t.simple_status = ANY (ARRAY['Đang học'::simple_status, 'Đăng ký mới'::simple_status])))), (0)::bigint))::integer AS current_occupancy
FROM dormitories d;

-- 17. trainees_with_workflow
DROP VIEW IF EXISTS public.trainees_with_workflow;
CREATE VIEW public.trainees_with_workflow WITH (security_invoker = true) AS
SELECT t.id, t.trainee_code, t.full_name, t.furigana, t.trainee_type, t.progression_stage, t.simple_status,
  t.birth_date, t.gender, t.phone, t.zalo, t.facebook, t.departure_date, t.return_date, t.expected_entry_month,
  t.notes, t.created_at, t.updated_at, t.birthplace, t.cccd_number, t.cccd_date, t.cccd_place, t.email,
  t.passport_number, t.passport_date, t.ethnicity, t.marital_status, t.current_situation, t.source,
  t.education_level, t.temp_address, t.current_address, t.permanent_address, t.household_address,
  t.parent_phone_1, t.parent_phone_2, t.height, t.weight, t.blood_group, t.vision_left, t.vision_right,
  t.dominant_hand, t.smoking, t.tattoo, t.drinking, t.health_status, t.hobbies, t.entry_date, t.class_id,
  t.enrollment_status, t.interview_pass_date, t.receiving_company_id, t.union_id, t.job_category_id,
  t.interview_count, t.registration_date, t.document_submission_date, t.otit_entry_date, t.nyukan_entry_date,
  t.coe_date, t.visa_date, t.absconded_date, t.early_return_date, t.early_return_reason, t.contract_end_date,
  t.contract_term, t.expected_return_date, t.photo_url, t.policy_category, t.religion, t.tattoo_description,
  tw.current_stage, tw.sub_status, tw.owner_department_id, tw.transitioned_at, tw.transitioned_by
FROM (trainees t
  LEFT JOIN trainee_workflow tw ON ((t.id = tw.trainee_id)));

-- Grant SELECT on all views to authenticated users
GRANT SELECT ON public.dashboard_available_years TO authenticated;
GRANT SELECT ON public.dashboard_monthly_combined TO authenticated;
GRANT SELECT ON public.dashboard_monthly_passed TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_birthplace TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_company TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_gender TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_source TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_stage TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_type TO authenticated;
GRANT SELECT ON public.dashboard_trainee_departures_monthly TO authenticated;
GRANT SELECT ON public.dashboard_trainee_kpis TO authenticated;
GRANT SELECT ON public.dashboard_trainee_monthly TO authenticated;
GRANT SELECT ON public.dashboard_trainee_passed_monthly TO authenticated;
GRANT SELECT ON public.companies_public TO authenticated;
GRANT SELECT ON public.teachers_public TO authenticated;
GRANT SELECT ON public.dormitories_with_occupancy TO authenticated;
GRANT SELECT ON public.trainees_with_workflow TO authenticated;