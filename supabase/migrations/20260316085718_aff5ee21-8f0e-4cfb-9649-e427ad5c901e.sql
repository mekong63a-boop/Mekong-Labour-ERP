-- Fix Security Definer views by setting security_invoker = true
-- This ensures RLS policies are enforced based on the querying user, not the view creator
ALTER VIEW public.class_student_counts SET (security_invoker = true);
ALTER VIEW public.dashboard_departed_by_departure_year SET (security_invoker = true);
ALTER VIEW public.dashboard_education_total SET (security_invoker = true);
ALTER VIEW public.post_departure_by_type SET (security_invoker = true);
ALTER VIEW public.post_departure_stats_by_year SET (security_invoker = true);
ALTER VIEW public.legal_company_stats SET (security_invoker = true);
ALTER VIEW public.legal_summary_stats SET (security_invoker = true);
ALTER VIEW public.legal_trainee_type_stats SET (security_invoker = true);
ALTER VIEW public.trainee_stage_counts SET (security_invoker = true);
ALTER VIEW public.education_interview_stats SET (security_invoker = true);