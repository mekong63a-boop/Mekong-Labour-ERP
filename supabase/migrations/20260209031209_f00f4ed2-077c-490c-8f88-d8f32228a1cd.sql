-- Add month columns to education_history table to preserve MM/YYYY format
ALTER TABLE public.education_history
ADD COLUMN start_month integer,
ADD COLUMN end_month integer;

-- Add comment for documentation
COMMENT ON COLUMN public.education_history.start_month IS 'Month of enrollment (1-12)';
COMMENT ON COLUMN public.education_history.end_month IS 'Month of graduation (1-12)';