-- Thêm tất cả transitions còn thiếu để Admin có thể chuyển linh hoạt
-- Đảm bảo từ bất kỳ stage nào cũng có thể đến bất kỳ stage nào

-- Helper: Tạo tất cả các transition thiếu
INSERT INTO public.master_stage_transitions (from_stage, to_stage, condition_description, requires_fields, auto_side_effects)
SELECT 
  fs.stage_code as from_stage,
  ts.stage_code as to_stage,
  'Chuyển linh hoạt (Admin)' as condition_description,
  NULL as requires_fields,
  CASE 
    WHEN ts.stage_code IN ('enrolled', 'training', 'interview_passed', 'document_processing', 'ready_to_depart') 
    THEN ARRAY['create_ktx_pending', 'reset_departure_fields']::text[]
    WHEN ts.stage_code = 'registered' 
    THEN ARRAY['reset_departure_fields']::text[]
    WHEN ts.stage_code IN ('terminated', 'departed') 
    THEN ARRAY['checkout_ktx']::text[]
    ELSE NULL
  END as auto_side_effects
FROM public.master_trainee_stages fs
CROSS JOIN public.master_trainee_stages ts
WHERE fs.stage_code != ts.stage_code
  AND NOT EXISTS (
    SELECT 1 FROM public.master_stage_transitions 
    WHERE from_stage = fs.stage_code AND to_stage = ts.stage_code
  );