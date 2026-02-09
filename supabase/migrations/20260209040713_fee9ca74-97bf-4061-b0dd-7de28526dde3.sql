-- Ensure education_history preserves month/year precision
ALTER TABLE public.education_history
  ADD COLUMN IF NOT EXISTS start_month integer,
  ADD COLUMN IF NOT EXISTS end_month integer;

COMMENT ON COLUMN public.education_history.start_month IS 'Month of enrollment (1-12)';
COMMENT ON COLUMN public.education_history.end_month IS 'Month of graduation (1-12)';