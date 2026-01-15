-- P0: Add unique constraint for test_scores table to allow upsert to work correctly
-- First, remove any duplicate records if they exist
DELETE FROM test_scores a USING test_scores b
WHERE a.id < b.id 
  AND a.class_id = b.class_id 
  AND a.trainee_id = b.trainee_id 
  AND a.test_name = b.test_name;

-- Add unique constraint
ALTER TABLE public.test_scores 
ADD CONSTRAINT test_scores_class_trainee_test_unique 
UNIQUE (class_id, trainee_id, test_name);