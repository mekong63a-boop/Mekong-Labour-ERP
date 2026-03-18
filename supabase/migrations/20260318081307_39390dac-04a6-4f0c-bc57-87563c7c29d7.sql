-- Fix 1: Remove broad enrollment_history ALL policy that bypasses menu permissions
DROP POLICY IF EXISTS "Staff and above can manage enrollment_history" ON public.enrollment_history;

-- Add proper delete policy using menu permission system
CREATE POLICY "enrollment_history_delete" ON public.enrollment_history
FOR DELETE TO authenticated
USING (public.can_delete('education'));

-- Add proper update policy using menu permission system
CREATE POLICY "enrollment_history_update" ON public.enrollment_history
FOR UPDATE TO authenticated
USING (public.can_update('education'))
WITH CHECK (public.can_update('education'));

-- Fix 2: Tighten profiles_select policy - admins need it for user management
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- Own profile always visible; admins with user management permission can see all
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_admin" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid()) 
  AND public.has_menu_permission(auth.uid(), 'user_management', 'view')
);