CREATE OR REPLACE VIEW education_interview_stats AS
WITH valid_classes AS (
  SELECT id FROM classes
),
trainees_in_classes AS (
  SELECT t.id, t.gender, t.class_id, t.progression_stage
  FROM trainees t
  WHERE t.class_id IS NOT NULL
    AND t.class_id IN (SELECT id FROM valid_classes)
    AND t.departure_date IS NULL
    AND (t.progression_stage IS NULL OR t.progression_stage::text NOT IN (
      'Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'
    ))
)
SELECT
  count(*) FILTER (WHERE progression_stage::text != 'Chưa đậu' AND gender = 'Nam')::integer AS passed_male,
  count(*) FILTER (WHERE progression_stage::text != 'Chưa đậu' AND gender = 'Nữ')::integer AS passed_female,
  count(*) FILTER (WHERE progression_stage::text != 'Chưa đậu')::integer AS passed_total,
  count(*) FILTER (WHERE (progression_stage IS NULL OR progression_stage::text = 'Chưa đậu') AND gender = 'Nam')::integer AS not_passed_male,
  count(*) FILTER (WHERE (progression_stage IS NULL OR progression_stage::text = 'Chưa đậu') AND gender = 'Nữ')::integer AS not_passed_female,
  count(*) FILTER (WHERE progression_stage IS NULL OR progression_stage::text = 'Chưa đậu')::integer AS not_passed_total
FROM trainees_in_classes;