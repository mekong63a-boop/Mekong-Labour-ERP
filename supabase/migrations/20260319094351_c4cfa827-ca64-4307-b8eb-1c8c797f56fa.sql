CREATE OR REPLACE VIEW public.trainee_stage_counts AS
SELECT progression_stage,
    count(*) AS count
   FROM trainees
  WHERE progression_stage IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY progression_stage;