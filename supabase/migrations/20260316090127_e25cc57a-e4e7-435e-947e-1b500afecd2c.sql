-- Fix 1: Prevent admin self-promotion to primary admin
-- In WITH CHECK, columns refer to the new row directly (no NEW prefix)
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;

CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_primary_admin(auth.uid()) 
    OR (is_primary_admin IS NOT TRUE)
  );

-- Fix 2: Restrict pending_registrations INSERT to own user_id only
DROP POLICY IF EXISTS "System can insert pending registrations" ON public.pending_registrations;

CREATE POLICY "Users can insert own pending registration" ON public.pending_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());