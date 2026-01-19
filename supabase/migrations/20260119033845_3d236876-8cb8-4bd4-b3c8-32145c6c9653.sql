-- =====================================================
-- DASHBOARD HỌC VIÊN - DATABASE VIEWS
-- Tất cả business logic xử lý ở database level
-- Frontend chỉ fetch và render
-- =====================================================

-- 1. VIEW: KPI Cards - Tổng quan học viên
CREATE OR REPLACE VIEW public.dashboard_trainee_kpis
WITH (security_invoker = on) AS
SELECT
  COUNT(*) AS total_trainees,
  -- simple_status enum values
  COUNT(*) FILTER (WHERE simple_status = 'Đăng ký mới') AS status_new,
  COUNT(*) FILTER (WHERE simple_status = 'Đang học') AS status_studying,
  COUNT(*) FILTER (WHERE simple_status = 'Bảo lưu') AS status_reserved,
  COUNT(*) FILTER (WHERE simple_status = 'Dừng chương trình') AS status_stopped,
  COUNT(*) FILTER (WHERE simple_status = 'Không học') AS status_not_studying,
  COUNT(*) FILTER (WHERE simple_status = 'Hủy') AS status_cancelled,
  COUNT(*) FILTER (WHERE simple_status = 'Đang ở Nhật') AS status_in_japan,
  COUNT(*) FILTER (WHERE simple_status = 'Rời công ty') AS status_left_company,
  -- progression_stage enum values
  COUNT(*) FILTER (WHERE progression_stage = 'Chưa đậu') AS stage_not_passed,
  COUNT(*) FILTER (WHERE progression_stage = 'Đậu phỏng vấn') AS stage_passed_interview,
  COUNT(*) FILTER (WHERE progression_stage = 'Nộp hồ sơ') AS stage_submitted,
  COUNT(*) FILTER (WHERE progression_stage = 'OTIT') AS stage_otit,
  COUNT(*) FILTER (WHERE progression_stage = 'Nyukan') AS stage_nyukan,
  COUNT(*) FILTER (WHERE progression_stage = 'COE') AS stage_coe,
  COUNT(*) FILTER (WHERE progression_stage = 'Visa') AS stage_visa,
  COUNT(*) FILTER (WHERE progression_stage = 'Xuất cảnh') AS stage_departed,
  COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc') AS stage_working,
  COUNT(*) FILTER (WHERE progression_stage = 'Hoàn thành hợp đồng') AS stage_completed,
  COUNT(*) FILTER (WHERE progression_stage = 'Bỏ trốn') AS stage_absconded,
  COUNT(*) FILTER (WHERE progression_stage = 'Về trước hạn') AS stage_early_return,
  -- trainee_type enum values
  COUNT(*) FILTER (WHERE trainee_type = 'Thực tập sinh') AS type_tts,
  COUNT(*) FILTER (WHERE trainee_type = 'Kỹ năng đặc định') AS type_knd,
  COUNT(*) FILTER (WHERE trainee_type = 'Kỹ sư') AS type_engineer,
  COUNT(*) FILTER (WHERE trainee_type = 'Du học sinh') AS type_student,
  COUNT(*) FILTER (WHERE trainee_type = 'Thực tập sinh số 3') AS type_tts3,
  -- Time-based counts
  COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE)) AS registered_this_month,
  COUNT(*) FILTER (WHERE registration_date >= date_trunc('year', CURRENT_DATE)) AS registered_this_year,
  COUNT(*) FILTER (WHERE departure_date >= date_trunc('month', CURRENT_DATE)) AS departed_this_month,
  COUNT(*) FILTER (WHERE departure_date >= date_trunc('year', CURRENT_DATE)) AS departed_this_year
FROM public.trainees;

-- 2. VIEW: Phân bố theo giai đoạn (Pie/Donut chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_stage
WITH (security_invoker = on) AS
SELECT
  COALESCE(progression_stage::text, 'Chưa xác định') AS stage,
  COUNT(*) AS count
FROM public.trainees
GROUP BY progression_stage
ORDER BY count DESC;

-- 3. VIEW: Phân bố theo trạng thái (Pie chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_status
WITH (security_invoker = on) AS
SELECT
  COALESCE(simple_status::text, 'Chưa xác định') AS status,
  COUNT(*) AS count
FROM public.trainees
GROUP BY simple_status
ORDER BY count DESC;

-- 4. VIEW: Phân bố theo loại TTS (Pie chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_type
WITH (security_invoker = on) AS
SELECT
  COALESCE(trainee_type::text, 'Chưa xác định') AS trainee_type,
  COUNT(*) AS count
FROM public.trainees
GROUP BY trainee_type
ORDER BY count DESC;

-- 5. VIEW: Đăng ký theo tháng - 12 tháng gần nhất (Line/Bar chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_monthly
WITH (security_invoker = on) AS
SELECT
  to_char(month_date, 'MM/YYYY') AS month_label,
  month_date,
  COALESCE(registrations, 0) AS registrations
FROM (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  )::date AS month_date
) months
LEFT JOIN (
  SELECT
    date_trunc('month', registration_date)::date AS reg_month,
    COUNT(*) AS registrations
  FROM public.trainees
  WHERE registration_date >= date_trunc('month', CURRENT_DATE) - interval '11 months'
  GROUP BY date_trunc('month', registration_date)
) t ON months.month_date = t.reg_month
ORDER BY month_date;

-- 6. VIEW: Phân bố theo nguồn giới thiệu (Bar chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_source
WITH (security_invoker = on) AS
SELECT
  COALESCE(source, 'Chưa xác định') AS source,
  COUNT(*) AS count
FROM public.trainees
GROUP BY source
ORDER BY count DESC
LIMIT 10;

-- 7. VIEW: Top tỉnh/thành có nhiều học viên nhất (Bar chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_birthplace
WITH (security_invoker = on) AS
SELECT
  COALESCE(birthplace, 'Chưa xác định') AS birthplace,
  COUNT(*) AS count
FROM public.trainees
GROUP BY birthplace
ORDER BY count DESC
LIMIT 10;

-- 8. VIEW: Phân bố theo giới tính (Pie chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_by_gender
WITH (security_invoker = on) AS
SELECT
  COALESCE(gender, 'Chưa xác định') AS gender,
  COUNT(*) AS count
FROM public.trainees
GROUP BY gender
ORDER BY count DESC;

-- 9. VIEW: Xuất cảnh theo tháng - 12 tháng gần nhất (Line chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_departures_monthly
WITH (security_invoker = on) AS
SELECT
  to_char(month_date, 'MM/YYYY') AS month_label,
  month_date,
  COALESCE(departures, 0) AS departures
FROM (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  )::date AS month_date
) months
LEFT JOIN (
  SELECT
    date_trunc('month', departure_date)::date AS dep_month,
    COUNT(*) AS departures
  FROM public.trainees
  WHERE departure_date >= date_trunc('month', CURRENT_DATE) - interval '11 months'
  GROUP BY date_trunc('month', departure_date)
) t ON months.month_date = t.dep_month
ORDER BY month_date;

-- 10. VIEW: Đậu phỏng vấn theo tháng (Line chart)
CREATE OR REPLACE VIEW public.dashboard_trainee_passed_monthly
WITH (security_invoker = on) AS
SELECT
  to_char(month_date, 'MM/YYYY') AS month_label,
  month_date,
  COALESCE(passed_count, 0) AS passed_count
FROM (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  )::date AS month_date
) months
LEFT JOIN (
  SELECT
    date_trunc('month', interview_pass_date)::date AS pass_month,
    COUNT(*) AS passed_count
  FROM public.trainees
  WHERE interview_pass_date >= date_trunc('month', CURRENT_DATE) - interval '11 months'
  GROUP BY date_trunc('month', interview_pass_date)
) t ON months.month_date = t.pass_month
ORDER BY month_date;