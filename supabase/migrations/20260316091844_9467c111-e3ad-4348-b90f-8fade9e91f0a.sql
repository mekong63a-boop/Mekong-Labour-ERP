-- Fix login_attempts INSERT policy - restrict to authenticated users only
DROP POLICY IF EXISTS "allow_login_attempt_logging" ON public.login_attempts;

-- Login attempts are recorded via SECURITY DEFINER function record_login_attempt()
-- so direct INSERT from client is not needed. But if needed, restrict to authenticated.
CREATE POLICY "allow_login_attempt_logging" ON public.login_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Note: The actual login attempt recording happens via record_login_attempt() 
-- which is SECURITY DEFINER, so this policy mainly serves as a safety net.
-- A stricter approach would be to deny all direct inserts, but keeping 
-- authenticated-only to not break existing flows.