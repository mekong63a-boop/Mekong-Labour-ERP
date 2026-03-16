-- Drop the vulnerable INSERT policy
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;

-- Create secure INSERT policy: only admins can insert roles
-- First-admin bootstrapping is handled by assign_first_admin() SECURITY DEFINER function
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
  );