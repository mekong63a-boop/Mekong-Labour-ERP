-- Backfill interview_history.job_category_id from trainees.job_category_id when missing
UPDATE public.interview_history ih
SET job_category_id = t.job_category_id
FROM public.trainees t
WHERE ih.trainee_id = t.id
  AND ih.job_category_id IS NULL
  AND t.job_category_id IS NOT NULL;