-- Drop and recreate view for top companies by trainees who passed interview
DROP VIEW IF EXISTS dashboard_trainee_by_company;

CREATE OR REPLACE VIEW dashboard_trainee_by_company AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  EXTRACT(YEAR FROM t.interview_pass_date) AS year,
  COUNT(*) AS count
FROM trainees t
LEFT JOIN companies c ON t.receiving_company_id = c.id
WHERE t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND t.progression_stage IN ('Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE')
GROUP BY c.id, c.name, EXTRACT(YEAR FROM t.interview_pass_date)
ORDER BY count DESC;