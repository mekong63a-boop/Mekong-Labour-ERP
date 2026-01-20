-- Fix security definer views by setting them to use SECURITY INVOKER
ALTER VIEW public.trainees_basic SET (security_invoker = on);
ALTER VIEW public.trainees_with_workflow SET (security_invoker = on);