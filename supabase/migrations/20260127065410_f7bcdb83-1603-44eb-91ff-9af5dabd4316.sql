
-- 1. Fix status_studying: chỉ đếm học viên trong lớp ĐANG HOẠT ĐỘNG (khớp với Education menu)
-- 2. Fix dashboard_monthly_combined: bao gồm TẤT CẢ các năm từ registration_date

-- Drop và tạo lại dashboard_trainee_kpis với logic đúng
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;

CREATE VIEW public.dashboard_trainee_kpis AS
WITH valid_classes AS (
  SELECT id FROM classes WHERE status = 'Đang hoạt động'
)
SELECT
  COUNT(*)::integer AS total_trainees,
  -- status_studying = học viên trong lớp ĐANG HOẠT ĐỘNG (khớp với Education menu)
  COUNT(*) FILTER (WHERE class_id IS NOT NULL AND class_id IN (SELECT id FROM valid_classes))::integer AS status_studying,
  -- Các thống kê khác
  COUNT(*) FILTER (WHERE progression_stage IS NULL OR progression_stage = 'Chưa đậu')::integer AS stage_recruited,
  COUNT(*) FILTER (WHERE progression_stage IN ('Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE'))::integer AS stage_visa_processing,
  COUNT(*) FILTER (WHERE progression_stage = 'Visa')::integer AS stage_ready_to_depart,
  COUNT(*) FILTER (WHERE progression_stage = 'Xuất cảnh')::integer AS stage_departed,
  COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_in_japan,
  COUNT(*) FILTER (WHERE progression_stage IN ('Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::integer AS stage_archived,
  COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_post_departure,
  -- Type breakdown
  COUNT(*) FILTER (WHERE trainee_type::text = 'Thực tập sinh')::integer AS type_tts,
  COUNT(*) FILTER (WHERE trainee_type::text = 'Kỹ năng đặc định')::integer AS type_knd,
  COUNT(*) FILTER (WHERE trainee_type::text = 'Kỹ sư')::integer AS type_engineer,
  COUNT(*) FILTER (WHERE trainee_type::text = 'Du học sinh')::integer AS type_student,
  COUNT(*) FILTER (WHERE trainee_type::text = 'TTS số 3')::integer AS type_tts3,
  -- Monthly/Yearly counts
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS registered_this_month,
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', registration_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS registered_this_year,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', departure_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS departed_this_month,
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS departed_this_year,
  -- Active orders count
  (SELECT COUNT(*)::integer FROM orders WHERE status = 'Đang tuyển') AS active_orders
FROM trainees;

-- Drop và tạo lại dashboard_monthly_combined để bao gồm TẤT CẢ các năm
DROP VIEW IF EXISTS public.dashboard_monthly_combined;

CREATE VIEW public.dashboard_monthly_combined AS
WITH 
-- Tất cả các tháng có đăng ký
registration_months AS (
  SELECT 
    DATE_TRUNC('month', registration_date)::date AS month_date,
    TO_CHAR(registration_date, 'MM/YYYY') AS month_label,
    COUNT(*) AS recruitment
  FROM trainees
  WHERE registration_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', registration_date), TO_CHAR(registration_date, 'MM/YYYY')
),
-- Tất cả các tháng có xuất cảnh
departure_months AS (
  SELECT 
    DATE_TRUNC('month', departure_date)::date AS month_date,
    TO_CHAR(departure_date, 'MM/YYYY') AS month_label,
    COUNT(*) AS departure
  FROM trainees
  WHERE departure_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', departure_date), TO_CHAR(departure_date, 'MM/YYYY')
),
-- Gộp tất cả các tháng
all_months AS (
  SELECT month_date, month_label FROM registration_months
  UNION
  SELECT month_date, month_label FROM departure_months
)
SELECT 
  am.month_date,
  am.month_label,
  COALESCE(rm.recruitment, 0)::integer AS recruitment,
  COALESCE(dm.departure, 0)::integer AS departure
FROM all_months am
LEFT JOIN registration_months rm ON am.month_date = rm.month_date
LEFT JOIN departure_months dm ON am.month_date = dm.month_date
ORDER BY am.month_date;
