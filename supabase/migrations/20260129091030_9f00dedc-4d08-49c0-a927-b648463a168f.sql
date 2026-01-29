
-- =============================================================================
-- SYSTEM RULE: Loại bỏ học viên đã xuất cảnh khỏi thống kê Giáo dục và KTX
-- Học viên đã xuất cảnh = có departure_date HOẶC progression_stage thuộc DEPARTED_STAGES
-- Cast progression_stage::text để so sánh với text
-- =============================================================================

-- 1. Cập nhật view education_interview_stats - loại bỏ học viên đã xuất cảnh
DROP VIEW IF EXISTS public.education_interview_stats;

CREATE VIEW public.education_interview_stats AS
WITH valid_classes AS (
  SELECT id FROM classes
),
trainees_in_classes AS (
  SELECT 
    t.id,
    t.gender,
    t.class_id,
    t.progression_stage
  FROM trainees t
  WHERE 
    t.class_id IS NOT NULL 
    AND t.class_id IN (SELECT id FROM valid_classes)
    -- Loại bỏ học viên đã xuất cảnh
    AND t.departure_date IS NULL
    AND (t.progression_stage IS NULL OR t.progression_stage::text NOT IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))
)
SELECT
  count(*) FILTER (WHERE progression_stage IS NOT NULL AND gender = 'Nam')::integer AS passed_male,
  count(*) FILTER (WHERE progression_stage IS NOT NULL AND gender = 'Nữ')::integer AS passed_female,
  count(*) FILTER (WHERE progression_stage IS NOT NULL)::integer AS passed_total,
  count(*) FILTER (WHERE progression_stage IS NULL AND gender = 'Nam')::integer AS not_passed_male,
  count(*) FILTER (WHERE progression_stage IS NULL AND gender = 'Nữ')::integer AS not_passed_female,
  count(*) FILTER (WHERE progression_stage IS NULL)::integer AS not_passed_total
FROM trainees_in_classes;

-- 2. Cập nhật view dormitory_gender_stats - loại bỏ học viên đã xuất cảnh
DROP VIEW IF EXISTS public.dormitory_gender_stats;

CREATE VIEW public.dormitory_gender_stats AS
SELECT
  count(DISTINCT dr.trainee_id) AS total_residents,
  count(DISTINCT CASE WHEN t.gender = 'Nam' THEN dr.trainee_id ELSE NULL END) AS male_count,
  count(DISTINCT CASE WHEN t.gender = 'Nữ' THEN dr.trainee_id ELSE NULL END) AS female_count
FROM dormitory_residents dr
JOIN trainees t ON t.id = dr.trainee_id
WHERE 
  dr.status = 'Đang ở'
  -- Loại bỏ học viên đã xuất cảnh
  AND t.departure_date IS NULL
  AND (t.progression_stage IS NULL OR t.progression_stage::text NOT IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'));

-- 3. Cập nhật view dormitories_with_occupancy để loại bỏ học viên đã xuất cảnh khỏi current_occupancy
DROP VIEW IF EXISTS public.dormitories_with_occupancy;

CREATE VIEW public.dormitories_with_occupancy AS
SELECT 
  d.id,
  d.name,
  d.address,
  d.capacity,
  d.notes,
  d.status,
  d.created_at,
  d.updated_at,
  (
    SELECT count(DISTINCT dr.trainee_id)
    FROM dormitory_residents dr
    JOIN trainees t ON t.id = dr.trainee_id
    WHERE dr.dormitory_id = d.id 
      AND dr.status = 'Đang ở'
      AND t.departure_date IS NULL
      AND (t.progression_stage IS NULL OR t.progression_stage::text NOT IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))
  )::integer AS current_occupancy
FROM dormitories d;
