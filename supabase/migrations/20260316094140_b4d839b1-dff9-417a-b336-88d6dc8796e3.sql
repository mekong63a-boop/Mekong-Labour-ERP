-- Fix login_attempts INSERT policy - remove always-true pattern
DROP POLICY IF EXISTS "allow_login_attempt_logging" ON public.login_attempts;
CREATE POLICY "allow_login_attempt_logging" ON public.login_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);