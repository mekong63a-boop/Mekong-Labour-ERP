CREATE OR REPLACE VIEW post_departure_stats_by_year AS
WITH combined AS (
  SELECT EXTRACT(year FROM departure_date)::text AS year,
    1 AS working, 0 AS early_return, 0 AS absconded, 0 AS completed
  FROM trainees
  WHERE departure_date IS NOT NULL
    AND progression_stage IN ('Đang làm việc', 'Xuất cảnh')

  UNION ALL
  SELECT EXTRACT(year FROM COALESCE(absconded_date, departure_date))::text,
    0, 0, 1, 0
  FROM trainees
  WHERE progression_stage = 'Bỏ trốn'
    AND COALESCE(absconded_date, departure_date) IS NOT NULL

  UNION ALL
  SELECT EXTRACT(year FROM COALESCE(early_return_date, departure_date))::text,
    0, 1, 0, 0
  FROM trainees
  WHERE progression_stage = 'Về trước hạn'
    AND COALESCE(early_return_date, departure_date) IS NOT NULL

  UNION ALL
  SELECT EXTRACT(year FROM COALESCE(return_date, departure_date))::text,
    0, 0, 0, 1
  FROM trainees
  WHERE progression_stage = 'Hoàn thành hợp đồng'
    AND COALESCE(return_date, departure_date) IS NOT NULL
)
SELECT year,
  SUM(working)::integer AS working,
  SUM(early_return)::integer AS early_return,
  SUM(absconded)::integer AS absconded,
  SUM(completed)::integer AS completed,
  COUNT(*)::integer AS total
FROM combined
GROUP BY year
ORDER BY year;