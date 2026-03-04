-- SSOT: View đếm học viên đã xuất cảnh theo năm departure_date
-- SOURCE: Menu Học viên → trường progression_stage + departure_date
CREATE OR REPLACE VIEW public.dashboard_departed_by_departure_year AS
SELECT 
  EXTRACT(YEAR FROM departure_date)::integer AS year,
  COUNT(*)::integer AS total,
  COUNT(*) FILTER (WHERE gender = 'Nam')::integer AS male_count,
  COUNT(*) FILTER (WHERE gender = 'Nữ')::integer AS female_count
FROM public.trainees
WHERE 
  progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng')
  AND departure_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM departure_date)
ORDER BY year DESC;

-- SSOT: View tổng sĩ số đang học từ class_student_counts (cùng nguồn menu Đào tạo)
CREATE OR REPLACE VIEW public.dashboard_education_total AS
SELECT 
  COALESCE(SUM(current_students), 0)::integer AS total_studying
FROM public.class_student_counts;