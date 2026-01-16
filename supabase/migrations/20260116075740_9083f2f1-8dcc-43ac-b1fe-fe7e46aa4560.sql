-- Fix RLS policy to allow teachers to insert new classes
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT 
  WITH CHECK (is_teacher_or_higher(auth.uid()));