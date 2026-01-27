-- =============================================================================
-- SYSTEM RULE FIX: Chuyển tất cả business logic vào database views
-- Supabase = Core (Brain), Lovable = UI (Hands only)
-- =============================================================================

-- 1. View tổng hợp thống kê legal (thay thế reduce() ở frontend)
CREATE OR REPLACE VIEW public.legal_summary_stats
WITH (security_invoker = true)
AS
SELECT 
  COUNT(DISTINCT id)::int as total_companies,
  COALESCE(SUM(doing_paperwork), 0)::int as total_paperwork,
  COALESCE(SUM(departed), 0)::int as total_departed,
  COALESCE(SUM(total_passed), 0)::int as total_all
FROM public.legal_company_stats;

-- 2. View thống kê học viên theo interview status (thay thế useInterviewStats)
CREATE OR REPLACE VIEW public.education_interview_stats
WITH (security_invoker = true)
AS
WITH valid_classes AS (
  SELECT id FROM public.classes
),
trainees_in_classes AS (
  SELECT 
    t.id,
    t.gender,
    t.class_id,
    t.progression_stage
  FROM public.trainees t
  WHERE t.class_id IS NOT NULL 
    AND t.class_id IN (SELECT id FROM valid_classes)
)
SELECT 
  -- Passed interview (has progression_stage)
  COUNT(*) FILTER (WHERE progression_stage IS NOT NULL AND gender = 'Nam')::int as passed_male,
  COUNT(*) FILTER (WHERE progression_stage IS NOT NULL AND gender = 'Nữ')::int as passed_female,
  COUNT(*) FILTER (WHERE progression_stage IS NOT NULL)::int as passed_total,
  -- Not passed interview (no progression_stage)
  COUNT(*) FILTER (WHERE progression_stage IS NULL AND gender = 'Nam')::int as not_passed_male,
  COUNT(*) FILTER (WHERE progression_stage IS NULL AND gender = 'Nữ')::int as not_passed_female,
  COUNT(*) FILTER (WHERE progression_stage IS NULL)::int as not_passed_total
FROM trainees_in_classes;

-- 3. View combined monthly data cho dashboard chart (thay thế useMemo combine)
CREATE OR REPLACE VIEW public.dashboard_monthly_combined
WITH (security_invoker = true)
AS
SELECT 
  COALESCE(r.month_label, d.month_label) as month_label,
  COALESCE(r.month_date, d.month_date) as month_date,
  COALESCE(r.registrations, 0)::int as recruitment,
  COALESCE(d.departures, 0)::int as departure
FROM public.dashboard_trainee_monthly r
FULL OUTER JOIN public.dashboard_trainee_departures_monthly d 
  ON r.month_label = d.month_label
ORDER BY COALESCE(r.month_date, d.month_date);

-- 4. Thêm cột đếm đơn hàng đang tuyển vào dashboard_trainee_kpis
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;

CREATE OR REPLACE VIEW public.dashboard_trainee_kpis
WITH (security_invoker = true)
AS
SELECT 
  -- Total counts
  (SELECT COUNT(*)::int FROM public.trainees) as total_trainees,
  
  -- Registration stats
  (SELECT COUNT(*)::int FROM public.trainees 
   WHERE created_at >= date_trunc('month', CURRENT_DATE)) as registered_this_month,
  (SELECT COUNT(*)::int FROM public.trainees 
   WHERE created_at >= date_trunc('year', CURRENT_DATE)) as registered_this_year,
  
  -- Departure stats
  (SELECT COUNT(*)::int FROM public.trainees 
   WHERE departure_date IS NOT NULL 
   AND departure_date >= date_trunc('month', CURRENT_DATE)) as departed_this_month,
  (SELECT COUNT(*)::int FROM public.trainees 
   WHERE departure_date IS NOT NULL 
   AND departure_date >= date_trunc('year', CURRENT_DATE)) as departed_this_year,
  
  -- Trainee types (correct enum: Thực tập sinh, Kỹ năng đặc định, Kỹ sư, Du học sinh, Thực tập sinh số 3)
  (SELECT COUNT(*)::int FROM public.trainees WHERE trainee_type = 'Thực tập sinh') as type_tts,
  (SELECT COUNT(*)::int FROM public.trainees WHERE trainee_type = 'Thực tập sinh số 3') as type_tts3,
  (SELECT COUNT(*)::int FROM public.trainees WHERE trainee_type = 'Kỹ năng đặc định') as type_knd,
  (SELECT COUNT(*)::int FROM public.trainees WHERE trainee_type = 'Kỹ sư') as type_engineer,
  (SELECT COUNT(*)::int FROM public.trainees WHERE trainee_type = 'Du học sinh') as type_student,
  
  -- Progression stages (correct enum values)
  (SELECT COUNT(*)::int FROM public.trainees WHERE progression_stage = 'Chưa đậu') as stage_recruited,
  (SELECT COUNT(*)::int FROM public.trainees WHERE simple_status = 'Đang học') as status_studying,
  (SELECT COUNT(*)::int FROM public.trainees WHERE progression_stage IN ('OTIT', 'Nyukan', 'COE', 'Visa')) as stage_visa_processing,
  (SELECT COUNT(*)::int FROM public.trainees WHERE progression_stage = 'Xuất cảnh') as stage_ready_to_depart,
  (SELECT COUNT(*)::int FROM public.trainees WHERE progression_stage = 'Đang làm việc') as stage_departed,
  (SELECT COUNT(*)::int FROM public.trainees WHERE progression_stage IN ('Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng')) as stage_post_departure,
  (SELECT COUNT(*)::int FROM public.trainees WHERE simple_status = 'Đang ở Nhật') as stage_in_japan,
  (SELECT COUNT(*)::int FROM public.trainees WHERE simple_status = 'Hủy') as stage_archived,
  
  -- Active orders (đang tuyển)
  (SELECT COUNT(*)::int FROM public.orders WHERE status = 'Đang tuyển') as active_orders;