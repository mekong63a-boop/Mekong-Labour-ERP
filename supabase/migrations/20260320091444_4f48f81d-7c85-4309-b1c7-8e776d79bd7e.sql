DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.trainees_masked ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "trainees_masked_select" ON public.trainees_masked FOR SELECT TO authenticated USING (true)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cannot enable RLS on view trainees_masked: %', SQLERRM;
END $$;