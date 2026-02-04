-- CLEANUP FINAL: user_sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own session" ON public.user_sessions;