-- Fix 1: Add is_primary_admin protection to user_roles_insert policy
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    AND (is_primary_admin IS NOT TRUE OR public.is_primary_admin(auth.uid()))
  );

-- Fix 3: Restrict department_menu_permissions SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view department permissions" ON public.department_menu_permissions;
CREATE POLICY "Authenticated users can view department permissions" ON public.department_menu_permissions
  FOR SELECT TO authenticated
  USING (true);