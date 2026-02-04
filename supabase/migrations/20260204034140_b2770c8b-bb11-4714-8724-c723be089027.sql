-- Create view for monthly trainee registration statistics
CREATE OR REPLACE VIEW public.v_trainees_registered_monthly AS
SELECT 
  EXTRACT(YEAR FROM registration_date)::integer AS year,
  EXTRACT(MONTH FROM registration_date)::integer AS month,
  TO_CHAR(registration_date, 'YYYY-MM') AS year_month,
  COUNT(*)::integer AS total_registered
FROM public.trainees
WHERE registration_date IS NOT NULL
GROUP BY 
  EXTRACT(YEAR FROM registration_date),
  EXTRACT(MONTH FROM registration_date),
  TO_CHAR(registration_date, 'YYYY-MM')
ORDER BY year DESC, month DESC;