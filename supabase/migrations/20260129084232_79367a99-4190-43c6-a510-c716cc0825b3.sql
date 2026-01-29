
-- Fix dashboard_trainee_by_company view to correctly count trainees by company and year
DROP VIEW IF EXISTS dashboard_trainee_by_company;

CREATE OR REPLACE VIEW dashboard_trainee_by_company AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  EXTRACT(YEAR FROM COALESCE(t.interview_pass_date, t.created_at))::INTEGER AS year,
  COUNT(*)::INTEGER AS count
FROM trainees t
JOIN companies c ON c.id = t.receiving_company_id
WHERE t.progression_stage IN (
  'Đậu phỏng vấn', 
  'Nộp hồ sơ', 
  'OTIT', 
  'Nyukan', 
  'COE', 
  'Visa', 
  'Xuất cảnh', 
  'Đang làm việc', 
  'Hoàn thành hợp đồng'
)
GROUP BY c.id, c.name, EXTRACT(YEAR FROM COALESCE(t.interview_pass_date, t.created_at))
ORDER BY year DESC, count DESC;

-- Create view for post-departure KPIs by trainee_type (for the 5 KPI cards)
CREATE OR REPLACE VIEW post_departure_by_type AS
SELECT 
  t.trainee_type,
  EXTRACT(YEAR FROM t.departure_date)::TEXT AS departure_year,
  COUNT(*)::INTEGER AS count
FROM trainees t
WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')
  AND t.departure_date IS NOT NULL
GROUP BY t.trainee_type, EXTRACT(YEAR FROM t.departure_date)
ORDER BY departure_year DESC, count DESC;

-- Create summary view for all-years totals by trainee_type
CREATE OR REPLACE VIEW post_departure_by_type_summary AS
SELECT 
  trainee_type,
  COUNT(*)::INTEGER AS count
FROM trainees
WHERE progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')
  AND departure_date IS NOT NULL
GROUP BY trainee_type
ORDER BY count DESC;
