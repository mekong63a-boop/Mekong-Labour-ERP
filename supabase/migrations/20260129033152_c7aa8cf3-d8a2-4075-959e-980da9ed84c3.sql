-- Create view for dormitory gender statistics
-- SYSTEM RULE: Logic tính toán nằm ở Supabase, UI chỉ hiển thị
CREATE OR REPLACE VIEW public.dormitory_gender_stats AS
SELECT
  COUNT(DISTINCT dr.trainee_id) AS total_residents,
  COUNT(DISTINCT CASE WHEN t.gender = 'Nam' THEN dr.trainee_id END) AS male_count,
  COUNT(DISTINCT CASE WHEN t.gender = 'Nữ' THEN dr.trainee_id END) AS female_count
FROM dormitory_residents dr
INNER JOIN trainees t ON t.id = dr.trainee_id
WHERE dr.status = 'Đang ở';