-- =============================================================================
-- FIX: Chuyển views sang SECURITY INVOKER để RLS hoạt động đúng
-- =============================================================================

-- Recreate views with SECURITY INVOKER (mặc định nhưng explicit cho rõ ràng)
DROP VIEW IF EXISTS public.trainee_stage_counts;
DROP VIEW IF EXISTS public.dormitories_with_occupancy;
DROP VIEW IF EXISTS public.union_stats;
DROP VIEW IF EXISTS public.education_stats;

-- 1. VIEW: trainee_stage_counts với SECURITY INVOKER
CREATE VIEW public.trainee_stage_counts 
WITH (security_invoker = true) AS
SELECT 
  COALESCE(progression_stage::text, 'Chưa đậu') as stage,
  COUNT(*)::integer as count
FROM public.trainees
GROUP BY COALESCE(progression_stage::text, 'Chưa đậu')
UNION ALL
SELECT 'all'::text as stage, COUNT(*)::integer as count
FROM public.trainees;

-- 2. VIEW: dormitories_with_occupancy với SECURITY INVOKER
CREATE VIEW public.dormitories_with_occupancy 
WITH (security_invoker = true) AS
SELECT 
  d.*,
  COALESCE(r.current_occupancy, 0)::integer as current_occupancy
FROM public.dormitories d
LEFT JOIN (
  SELECT 
    dormitory_id,
    COUNT(*) as current_occupancy
  FROM public.dormitory_residents
  WHERE status = 'Đang ở'
  GROUP BY dormitory_id
) r ON d.id = r.dormitory_id;

-- 3. VIEW: union_stats với SECURITY INVOKER
CREATE VIEW public.union_stats 
WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(*) FROM public.union_members WHERE status = 'Đang tham gia')::integer as active_members,
  (SELECT COUNT(*) FROM public.union_members)::integer as total_members,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Thu'), 0)::numeric as total_income,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Chi'), 0)::numeric as total_expense,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Thu'), 0) - 
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Chi'), 0) as balance;

-- 4. VIEW: education_stats với SECURITY INVOKER
CREATE VIEW public.education_stats 
WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(*) FROM public.teachers)::integer as total_teachers,
  (SELECT COUNT(*) FROM public.teachers WHERE status = 'Đang làm việc')::integer as active_teachers,
  (SELECT COUNT(*) FROM public.classes)::integer as total_classes,
  (SELECT COUNT(*) FROM public.classes WHERE status = 'Đang hoạt động')::integer as active_classes;

-- 5. Grant permissions
GRANT SELECT ON public.trainee_stage_counts TO authenticated;
GRANT SELECT ON public.dormitories_with_occupancy TO authenticated;
GRANT SELECT ON public.union_stats TO authenticated;
GRANT SELECT ON public.education_stats TO authenticated;