-- Add evaluation column for grade assessment in test_scores
ALTER TABLE public.test_scores 
ADD COLUMN evaluation text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.test_scores.evaluation IS 'Text evaluation/grade assessment for the test score (e.g., A, B, C or descriptive feedback)';