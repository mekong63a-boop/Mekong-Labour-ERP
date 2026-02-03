-- Retry: keep month_date column type (timestamp with time zone) to avoid 42P16
BEGIN;

-- 1) Data cleanup (test env)
UPDATE public.trainees
SET interview_pass_date = NULL
WHERE interview_pass_date IS NOT NULL
  AND (progression_stage IS NULL OR progression_stage = 'Chưa đậu');

-- 2) Recreate view without changing column types
CREATE OR REPLACE VIEW public.dashboard_monthly_passed
WITH (security_invoker = on) AS
SELECT
  date_trunc('month', t.interview_pass_date) AS month_date,
  to_char(date_trunc('month', t.interview_pass_date), 'MM/YYYY') AS month_label,
  count(*)::int AS passed_count
FROM public.trainees t
WHERE t.interview_pass_date IS NOT NULL
  AND t.progression_stage IS NOT NULL
  AND t.progression_stage <> 'Chưa đậu'
GROUP BY 1, 2
ORDER BY 1;

COMMIT;
