-- =============================================
-- Revoke anon access from all sensitive views
-- Views with security_invoker=true already inherit base table RLS for authenticated users
-- =============================================

-- Financial data
REVOKE SELECT ON public.union_stats FROM anon;

-- Legal/company data
REVOKE SELECT ON public.legal_company_stats FROM anon;
REVOKE SELECT ON public.legal_trainee_type_stats FROM anon;
REVOKE SELECT ON public.legal_summary_stats FROM anon;

-- Dashboard/reporting views
REVOKE SELECT ON public.dashboard_trainee_kpis FROM anon;
REVOKE SELECT ON public.dashboard_trainee_by_company FROM anon;
REVOKE SELECT ON public.trainee_stage_counts FROM anon;
REVOKE SELECT ON public.v_trainee_interview_count FROM anon;
REVOKE SELECT ON public.v_trainees_registered_monthly FROM anon;

-- Post-departure views
REVOKE SELECT ON public.post_departure_stats_by_year FROM anon;
REVOKE SELECT ON public.post_departure_by_type FROM anon;
REVOKE SELECT ON public.post_departure_by_type_summary FROM anon;

-- =============================================
-- Fix department_members SELECT policy
-- Regular users see only own records; admin/manager see all
-- =============================================
DROP POLICY IF EXISTS "department_members_select" ON public.department_members;
CREATE POLICY "department_members_select" ON public.department_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'manager'
    )
  );