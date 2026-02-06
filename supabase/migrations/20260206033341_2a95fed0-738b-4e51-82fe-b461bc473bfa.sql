-- Update dormitory_gender_stats view to filter by simple_status only
-- BUSINESS RULE: Chỉ tính học viên có simple_status = "Đang học" hoặc "Đăng ký mới"

DROP VIEW IF EXISTS dormitory_gender_stats;

CREATE VIEW dormitory_gender_stats AS
SELECT 
  count(DISTINCT dr.trainee_id) AS total_residents,
  count(DISTINCT CASE WHEN t.gender = 'Nam' THEN dr.trainee_id ELSE NULL END) AS male_count,
  count(DISTINCT CASE WHEN t.gender = 'Nữ' THEN dr.trainee_id ELSE NULL END) AS female_count
FROM dormitory_residents dr
JOIN trainees t ON t.id = dr.trainee_id
WHERE dr.status = 'Đang ở'
  AND t.simple_status IN ('Đang học', 'Đăng ký mới');

-- Also update dormitories_with_occupancy view to use same logic
DROP VIEW IF EXISTS dormitories_with_occupancy;

CREATE VIEW dormitories_with_occupancy AS
SELECT 
  d.*,
  COALESCE(
    (
      SELECT count(DISTINCT dr.trainee_id)
      FROM dormitory_residents dr
      JOIN trainees t ON t.id = dr.trainee_id
      WHERE dr.dormitory_id = d.id 
        AND dr.status = 'Đang ở'
        AND t.simple_status IN ('Đang học', 'Đăng ký mới')
    ), 
    0
  )::int AS current_occupancy
FROM dormitories d;