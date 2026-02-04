-- Step 1: Add new enum values only (must be committed before use)
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'registered';
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'enrolled';
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'training';
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'interview_passed';
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'document_processing';
ALTER TYPE trainee_workflow_stage ADD VALUE IF NOT EXISTS 'terminated';