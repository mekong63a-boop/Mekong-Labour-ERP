
-- Thêm thống kê nam/nữ vào dashboard_trainee_kpis
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;

CREATE VIEW public.dashboard_trainee_kpis AS
WITH valid_classes AS (
  SELECT id FROM classes WHERE status = 'Đang hoạt động'
)
SELECT
  COUNT(*)::integer AS total_trainees,
  -- Tổng số theo giới tính
  COUNT(*) FILTER (WHERE gender = 'Nam')::integer AS total_male,
  COUNT(*) FILTER (WHERE gender = 'Nữ')::integer AS total_female,
  
  -- status_studying = học viên trong lớp ĐANG HOẠT ĐỘNG
  COUNT(*) FILTER (WHERE class_id IS NOT NULL AND class_id IN (SELECT id FROM valid_classes))::integer AS status_studying,
  COUNT(*) FILTER (WHERE class_id IS NOT NULL AND class_id IN (SELECT id FROM valid_classes) AND gender = 'Nam')::integer AS studying_male,
  COUNT(*) FILTER (WHERE class_id IS NOT NULL AND class_id IN (SELECT id FROM valid_classes) AND gender = 'Nữ')::integer AS studying_female,
  
  -- Xuất cảnh năm nay theo giới tính
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS departed_this_year,
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE) AND gender = 'Nam')::integer AS departed_male,
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE) AND gender = 'Nữ')::integer AS departed_female,
  
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
  -- Monthly counts
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS registered_this_month,
  COUNT(*) FILTER (WHERE DATE_TRUNC('year', registration_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS registered_this_year,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', departure_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS departed_this_month,
  -- Active orders count
  (SELECT COUNT(*)::integer FROM orders WHERE status = 'Đang tuyển') AS active_orders
FROM trainees;
