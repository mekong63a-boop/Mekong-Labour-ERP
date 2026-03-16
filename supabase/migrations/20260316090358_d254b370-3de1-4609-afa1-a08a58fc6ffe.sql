-- Fix: Restrict user_roles INSERT bootstrap path
-- When no admin exists, only allow inserting a non-admin role for the caller's own user_id
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admins can insert any role
    public.is_admin(auth.uid())
    OR (
      -- Bootstrap: only when no admin exists, only for own user_id, only non-admin role
      NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
      AND user_id = auth.uid()
      AND role != 'admin'
    )
  );