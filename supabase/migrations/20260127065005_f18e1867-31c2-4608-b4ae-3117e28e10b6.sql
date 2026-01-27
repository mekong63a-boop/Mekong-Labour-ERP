
-- Fix dashboard_trainee_kpis view to count trainees in classes correctly (not teachers)
-- SYSTEM RULE: status_studying = số học viên có class_id (đang được gán vào lớp học)

DROP VIEW IF EXISTS public.dashboard_trainee_kpis;

CREATE VIEW public.dashboard_trainee_kpis AS
SELECT
  COUNT(*)::integer AS total_trainees,
  -- status_studying = học viên đang được gán vào lớp học (có class_id)
  COUNT(*) FILTER (WHERE class_id IS NOT NULL)::integer AS status_studying,
  -- Các thống kê khác
  COUNT(*) FILTER (WHERE progression_stage IS NULL OR progression_stage = 'Chưa đậu')::integer AS stage_recruited,
  COUNT(*) FILTER (WHERE progression_stage IN ('Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE'))::integer AS stage_visa_processing,
  COUNT(*) FILTER (WHERE progression_stage = 'Visa')::integer AS stage_ready_to_depart,
  COUNT(*) FILTER (WHERE progression_stage = 'Xuất cảnh')::integer AS stage_departed,
  COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_in_japan,
  COUNT(*) FILTER (WHERE progression_stage IN ('Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::integer AS stage_archived,
  COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_post_departure,
  -- Type breakdown (using correct Vietnamese enum values)
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
  -- Active orders count (from orders table)
  (SELECT COUNT(*)::integer FROM orders WHERE status = 'Đang tuyển') AS active_orders
FROM trainees;
