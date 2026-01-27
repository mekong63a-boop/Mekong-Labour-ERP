-- Create view for available years from all date fields in trainees
CREATE OR REPLACE VIEW dashboard_available_years AS
SELECT DISTINCT year FROM (
  SELECT EXTRACT(YEAR FROM registration_date) AS year FROM trainees WHERE registration_date IS NOT NULL
  UNION
  SELECT EXTRACT(YEAR FROM departure_date) AS year FROM trainees WHERE departure_date IS NOT NULL
  UNION
  SELECT EXTRACT(YEAR FROM interview_pass_date) AS year FROM trainees WHERE interview_pass_date IS NOT NULL
  UNION
  SELECT EXTRACT(YEAR FROM created_at) AS year FROM trainees WHERE created_at IS NOT NULL
) AS all_years
WHERE year IS NOT NULL
ORDER BY year DESC;