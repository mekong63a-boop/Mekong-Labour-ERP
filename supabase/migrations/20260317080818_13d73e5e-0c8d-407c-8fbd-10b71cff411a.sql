
-- ============================================================
-- P0-1: Fix user_roles UPDATE privilege escalation
-- Non-primary admin cannot modify rows where is_primary_admin=true
-- ============================================================
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    is_admin(auth.uid())
    AND (
      is_primary_admin(auth.uid())
      OR (is_primary_admin IS NOT TRUE)
    )
  )
  WITH CHECK (
    is_primary_admin(auth.uid())
    OR (is_primary_admin IS NOT TRUE)
  );

-- ============================================================
-- P0-2: Fix department_menu_permissions ALL policy from public to authenticated
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage department permissions" ON public.department_menu_permissions;
CREATE POLICY "Admins can manage department permissions" ON public.department_menu_permissions
  FOR ALL TO authenticated
  USING (is_admin_check(auth.uid()))
  WITH CHECK (is_admin_check(auth.uid()));

-- ============================================================
-- P0-3: Fix login_attempts - remove direct INSERT, rely on SECURITY DEFINER RPC only
-- ============================================================
DROP POLICY IF EXISTS "allow_login_attempt_logging" ON public.login_attempts;
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;

-- Re-create admin view policy properly scoped to authenticated
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));
