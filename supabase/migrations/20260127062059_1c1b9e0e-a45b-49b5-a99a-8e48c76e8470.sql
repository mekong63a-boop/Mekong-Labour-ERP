-- Create view for top companies by recruited trainees in current year
CREATE OR REPLACE VIEW dashboard_trainee_by_company AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  EXTRACT(YEAR FROM t.registration_date) AS year,
  COUNT(*) AS count
FROM trainees t
LEFT JOIN companies c ON t.receiving_company_id = c.id
WHERE t.receiving_company_id IS NOT NULL
  AND t.registration_date IS NOT NULL
GROUP BY c.id, c.name, EXTRACT(YEAR FROM t.registration_date)
ORDER BY count DESC;