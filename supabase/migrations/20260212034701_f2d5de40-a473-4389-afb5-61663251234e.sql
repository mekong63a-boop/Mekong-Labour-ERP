
-- Add locking columns to trainees
ALTER TABLE public.trainees ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.trainees ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Update RLS policy for trainees UPDATE: locked trainees can only be edited by Primary Admin
DROP POLICY IF EXISTS "trainees_update" ON public.trainees;
CREATE POLICY "trainees_update" ON public.trainees
  FOR UPDATE TO authenticated
  USING (
    can_update('trainees') AND (
      NOT COALESCE(is_locked, false) OR is_primary_admin(auth.uid())
    )
  )
  WITH CHECK (
    can_update('trainees') AND (
      NOT COALESCE(is_locked, false) OR is_primary_admin(auth.uid())
    )
  );
