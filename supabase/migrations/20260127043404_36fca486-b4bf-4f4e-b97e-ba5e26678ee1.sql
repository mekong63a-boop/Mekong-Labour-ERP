-- =============================================================================
-- MIGRATION: Tạo thêm views để di chuyển business logic từ frontend
-- Tuân thủ SYSTEM RULE: Supabase = não, Lovable = tay chân
-- =============================================================================

-- 1. VIEW: Order Stats (thay thế useOrderStats client-side calculation)
CREATE VIEW public.order_stats 
WITH (security_invoker = true) AS
SELECT 
  COUNT(*)::integer as total,
  COUNT(*) FILTER (WHERE status = 'Đang tuyển')::integer as recruiting,
  COUNT(*) FILTER (WHERE status = 'Đã đủ form')::integer as form_complete,
  COUNT(*) FILTER (WHERE status = 'Đã phỏng vấn')::integer as interviewed,
  COUNT(*) FILTER (WHERE status = 'Hoàn thành')::integer as completed,
  COUNT(*) FILTER (WHERE status = 'Hủy')::integer as cancelled
FROM public.orders;

-- 2. VIEW: Post-Departure Stats by Year (thay thế client-side calculation trong PostDeparturePage)
CREATE VIEW public.post_departure_stats_by_year 
WITH (security_invoker = true) AS
SELECT 
  EXTRACT(YEAR FROM departure_date::date)::text as year,
  COUNT(*) FILTER (WHERE progression_stage IN ('Đang làm việc', 'Xuất cảnh'))::integer as working,
  COUNT(*) FILTER (WHERE progression_stage = 'Về trước hạn')::integer as early_return,
  COUNT(*) FILTER (WHERE progression_stage = 'Bỏ trốn')::integer as absconded,
  COUNT(*) FILTER (WHERE progression_stage = 'Hoàn thành hợp đồng')::integer as completed,
  COUNT(*)::integer as total
FROM public.trainees
WHERE departure_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM departure_date::date)
ORDER BY year;

-- 3. VIEW: Post-Departure Summary (tổng hợp tất cả năm)
CREATE VIEW public.post_departure_summary 
WITH (security_invoker = true) AS
SELECT 
  COUNT(*) FILTER (WHERE progression_stage IN ('Đang làm việc', 'Xuất cảnh'))::integer as working,
  COUNT(*) FILTER (WHERE progression_stage = 'Về trước hạn')::integer as early_return,
  COUNT(*) FILTER (WHERE progression_stage = 'Bỏ trốn')::integer as absconded,
  COUNT(*) FILTER (WHERE progression_stage = 'Hoàn thành hợp đồng')::integer as completed,
  COUNT(*)::integer as total
FROM public.trainees
WHERE departure_date IS NOT NULL;

-- 4. VIEW: Legal Company Stats (thay thế client-side calculation trong LegalPage)
CREATE VIEW public.legal_company_stats 
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.code,
  c.name,
  c.name_japanese,
  c.address,
  c.work_address,
  -- Count trainees doing paperwork (specific stages)
  COUNT(t.id) FILTER (WHERE t.progression_stage IN ('Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa'))::integer as doing_paperwork,
  -- Count departed trainees  
  COUNT(t.id) FILTER (WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng'))::integer as departed,
  -- Total passed interview
  COUNT(t.id)::integer as total_passed,
  -- Last interview date
  MAX(ih.interview_date) as last_interview_date
FROM public.companies c
LEFT JOIN public.trainees t ON t.receiving_company_id = c.id
LEFT JOIN public.interview_history ih ON ih.company_id = c.id
GROUP BY c.id, c.code, c.name, c.name_japanese, c.address, c.work_address;

-- 5. Grant permissions
GRANT SELECT ON public.order_stats TO authenticated;
GRANT SELECT ON public.post_departure_stats_by_year TO authenticated;
GRANT SELECT ON public.post_departure_summary TO authenticated;
GRANT SELECT ON public.legal_company_stats TO authenticated;