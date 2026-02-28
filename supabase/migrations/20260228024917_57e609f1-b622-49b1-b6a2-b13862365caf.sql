-- Fix post_departure_by_type view: dùng ngày sự kiện thực tế thay vì departure_date cho tất cả
CREATE OR REPLACE VIEW post_departure_by_type AS
WITH combined AS (
  -- Đang ở Nhật: nhóm theo departure_date
  SELECT trainee_type, EXTRACT(year FROM departure_date)::text AS departure_year
  FROM trainees
  WHERE departure_date IS NOT NULL
    AND progression_stage IN ('Đang làm việc', 'Xuất cảnh')

  UNION ALL
  -- Bỏ trốn: nhóm theo absconded_date
  SELECT trainee_type, EXTRACT(year FROM COALESCE(absconded_date, departure_date))::text
  FROM trainees
  WHERE progression_stage = 'Bỏ trốn'
    AND COALESCE(absconded_date, departure_date) IS NOT NULL

  UNION ALL
  -- Về trước hạn: nhóm theo early_return_date
  SELECT trainee_type, EXTRACT(year FROM COALESCE(early_return_date, departure_date))::text
  FROM trainees
  WHERE progression_stage = 'Về trước hạn'
    AND COALESCE(early_return_date, departure_date) IS NOT NULL

  UNION ALL
  -- Hoàn thành HĐ: nhóm theo return_date
  SELECT trainee_type, EXTRACT(year FROM COALESCE(return_date, departure_date))::text
  FROM trainees
  WHERE progression_stage = 'Hoàn thành hợp đồng'
    AND COALESCE(return_date, departure_date) IS NOT NULL
)
SELECT trainee_type, departure_year, count(*)::integer AS count
FROM combined
GROUP BY trainee_type, departure_year
ORDER BY departure_year DESC, count DESC;