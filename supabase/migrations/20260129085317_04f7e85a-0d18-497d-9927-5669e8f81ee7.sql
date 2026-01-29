-- Create view for monthly interview passed data (aggregated by month/year)
CREATE OR REPLACE VIEW dashboard_monthly_passed AS
SELECT 
  DATE_TRUNC('month', interview_pass_date) AS month_date,
  TO_CHAR(interview_pass_date, 'MM/YYYY') AS month_label,
  COUNT(*)::integer AS passed_count
FROM trainees
WHERE interview_pass_date IS NOT NULL
GROUP BY DATE_TRUNC('month', interview_pass_date), TO_CHAR(interview_pass_date, 'MM/YYYY')
ORDER BY month_date;