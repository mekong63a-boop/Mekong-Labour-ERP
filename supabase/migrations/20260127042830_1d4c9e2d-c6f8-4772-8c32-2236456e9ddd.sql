-- =============================================================================
-- MIGRATION: Di chuyển business logic từ frontend vào Supabase
-- Tuân thủ SYSTEM RULE: Supabase = não, Lovable = tay chân
-- =============================================================================

-- 1. VIEW: Đếm số lượng trainee theo progression_stage (thay thế useTraineeStageCounts)
-- Cast sang TEXT để tránh lỗi enum
CREATE OR REPLACE VIEW public.trainee_stage_counts AS
SELECT 
  COALESCE(progression_stage::text, 'Chưa đậu') as stage,
  COUNT(*)::integer as count
FROM public.trainees
GROUP BY COALESCE(progression_stage::text, 'Chưa đậu')
UNION ALL
SELECT 'all'::text as stage, COUNT(*)::integer as count
FROM public.trainees;

-- 2. VIEW: Dormitory với số lượng cư dân hiện tại (thay thế client-side counting)
CREATE OR REPLACE VIEW public.dormitories_with_occupancy AS
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

-- 3. VIEW: Thống kê công đoàn nội bộ (thay thế useUnionStats)
CREATE OR REPLACE VIEW public.union_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.union_members WHERE status = 'Đang tham gia')::integer as active_members,
  (SELECT COUNT(*) FROM public.union_members)::integer as total_members,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Thu'), 0)::numeric as total_income,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Chi'), 0)::numeric as total_expense,
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Thu'), 0) - 
  COALESCE((SELECT SUM(amount) FROM public.union_transactions WHERE transaction_type = 'Chi'), 0) as balance;

-- 4. VIEW: Thống kê giáo dục (teachers và classes active)
CREATE OR REPLACE VIEW public.education_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.teachers)::integer as total_teachers,
  (SELECT COUNT(*) FROM public.teachers WHERE status = 'Đang làm việc')::integer as active_teachers,
  (SELECT COUNT(*) FROM public.classes)::integer as total_classes,
  (SELECT COUNT(*) FROM public.classes WHERE status = 'Đang hoạt động')::integer as active_classes;

-- 5. Grant permissions cho các views mới
GRANT SELECT ON public.trainee_stage_counts TO authenticated;
GRANT SELECT ON public.dormitories_with_occupancy TO authenticated;
GRANT SELECT ON public.union_stats TO authenticated;
GRANT SELECT ON public.education_stats TO authenticated;