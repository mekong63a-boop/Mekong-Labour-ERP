-- =========================================================================
-- MIGRATION: Cleanup enrollment_status - Single Source of Truth
-- Sử dụng trainee_workflow.current_stage làm nguồn duy nhất cho trạng thái
-- =========================================================================

-- 1. Tạo function mapping từ progression_stage cũ sang trainee_workflow_stage
CREATE OR REPLACE FUNCTION public.map_progression_to_workflow_stage(old_stage TEXT)
RETURNS trainee_workflow_stage
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE old_stage
    WHEN 'Chưa đậu' THEN 'recruited'::trainee_workflow_stage
    WHEN 'Đậu phỏng vấn' THEN 'recruited'::trainee_workflow_stage
    WHEN 'Nộp hồ sơ' THEN 'trained'::trainee_workflow_stage
    WHEN 'OTIT' THEN 'trained'::trainee_workflow_stage
    WHEN 'Nyukan' THEN 'visa_processing'::trainee_workflow_stage
    WHEN 'COE' THEN 'visa_processing'::trainee_workflow_stage
    WHEN 'Visa' THEN 'ready_to_depart'::trainee_workflow_stage
    WHEN 'Xuất cảnh' THEN 'departed'::trainee_workflow_stage
    WHEN 'Đang làm việc' THEN 'post_departure'::trainee_workflow_stage
    WHEN 'Hoàn thành hợp đồng' THEN 'archived'::trainee_workflow_stage
    WHEN 'Bỏ trốn' THEN 'archived'::trainee_workflow_stage
    WHEN 'Về trước hạn' THEN 'archived'::trainee_workflow_stage
    ELSE 'recruited'::trainee_workflow_stage
  END;
END;
$$;

-- 2. Tạo function mapping từ trainee_workflow_stage sang display label (tiếng Việt)
CREATE OR REPLACE FUNCTION public.workflow_stage_label(stage trainee_workflow_stage)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE stage
    WHEN 'recruited' THEN 'Mới tuyển dụng'
    WHEN 'trained' THEN 'Đang đào tạo'
    WHEN 'dormitory' THEN 'Chờ xuất cảnh'
    WHEN 'visa_processing' THEN 'Đang xử lý visa'
    WHEN 'ready_to_depart' THEN 'Sẵn sàng xuất cảnh'
    WHEN 'departed' THEN 'Đã xuất cảnh'
    WHEN 'post_departure' THEN 'Đang ở Nhật'
    WHEN 'archived' THEN 'Lưu trữ'
    ELSE 'Không xác định'
  END;
END;
$$;

-- 3. Sync trainee_workflow cho TẤT CẢ trainees hiện có (chưa có workflow record)
INSERT INTO trainee_workflow (trainee_id, current_stage, notes, created_at, updated_at)
SELECT 
  t.id,
  map_progression_to_workflow_stage(t.progression_stage::TEXT),
  'Auto-migrated from progression_stage: ' || COALESCE(t.progression_stage::TEXT, 'NULL'),
  NOW(),
  NOW()
FROM trainees t
WHERE NOT EXISTS (
  SELECT 1 FROM trainee_workflow tw WHERE tw.trainee_id = t.id
);

-- 4. Tạo trigger tự động tạo workflow record khi INSERT trainee mới
CREATE OR REPLACE FUNCTION public.auto_create_trainee_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO trainee_workflow (trainee_id, current_stage, created_at, updated_at)
  VALUES (NEW.id, 'recruited'::trainee_workflow_stage, NOW(), NOW())
  ON CONFLICT (trainee_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_workflow ON trainees;
CREATE TRIGGER trigger_auto_create_workflow
  AFTER INSERT ON trainees
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_trainee_workflow();

-- 5. Update VIEW dashboard_trainee_by_stage để dùng trainee_workflow
DROP VIEW IF EXISTS dashboard_trainee_by_stage;
CREATE OR REPLACE VIEW public.dashboard_trainee_by_stage
WITH (security_invoker = on) AS
SELECT 
  tw.current_stage::TEXT as stage,
  workflow_stage_label(tw.current_stage) as stage_label,
  COUNT(*) as count
FROM trainees t
LEFT JOIN trainee_workflow tw ON t.id = tw.trainee_id
GROUP BY tw.current_stage
ORDER BY count DESC;

-- 6. Create view để lấy stage counts cho tabs (dùng workflow)
CREATE OR REPLACE VIEW public.trainee_workflow_counts
WITH (security_invoker = on) AS
SELECT 
  'all' as stage_key,
  'Tất cả' as stage_label,
  COUNT(*) as count
FROM trainees
UNION ALL
SELECT 
  tw.current_stage::TEXT as stage_key,
  workflow_stage_label(tw.current_stage) as stage_label,
  COUNT(*) as count
FROM trainees t
JOIN trainee_workflow tw ON t.id = tw.trainee_id
GROUP BY tw.current_stage;

-- 7. Create or replace trainees_with_workflow view (JOIN trainees + workflow)
CREATE OR REPLACE VIEW public.trainees_with_workflow
WITH (security_invoker = on) AS
SELECT 
  t.id,
  t.trainee_code,
  t.full_name,
  t.furigana,
  t.gender,
  t.birth_date,
  t.birthplace,
  t.ethnicity,
  t.class_id,
  t.trainee_type,
  t.education_level,
  t.marital_status,
  t.height,
  t.weight,
  t.vision_left,
  t.vision_right,
  t.blood_group,
  t.dominant_hand,
  t.smoking,
  t.drinking,
  t.tattoo,
  t.tattoo_description,
  t.hobbies,
  t.health_status,
  t.registration_date,
  t.interview_pass_date,
  t.interview_count,
  t.expected_entry_month,
  t.entry_date,
  t.departure_date,
  t.return_date,
  t.expected_return_date,
  t.contract_term,
  t.contract_end_date,
  t.early_return_date,
  t.early_return_reason,
  t.absconded_date,
  t.current_situation,
  t.document_submission_date,
  t.otit_entry_date,
  t.nyukan_entry_date,
  t.coe_date,
  t.visa_date,
  t.receiving_company_id,
  t.union_id,
  t.job_category_id,
  t.notes,
  t.photo_url,
  t.created_at,
  t.updated_at,
  -- Workflow fields
  tw.current_stage as workflow_stage,
  workflow_stage_label(tw.current_stage) as workflow_stage_label,
  tw.sub_status as workflow_sub_status,
  tw.owner_department_id,
  tw.transitioned_at,
  tw.transitioned_by
FROM trainees t
LEFT JOIN trainee_workflow tw ON t.id = tw.trainee_id;

-- 8. Grant SELECT on new views
GRANT SELECT ON public.dashboard_trainee_by_stage TO authenticated;
GRANT SELECT ON public.trainee_workflow_counts TO authenticated;
GRANT SELECT ON public.trainees_with_workflow TO authenticated;
GRANT SELECT ON public.dashboard_trainee_by_stage TO anon;
GRANT SELECT ON public.trainee_workflow_counts TO anon;

-- 9. Update dashboard_trainee_kpis để dùng workflow counts
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;
CREATE OR REPLACE VIEW public.dashboard_trainee_kpis
WITH (security_invoker = on) AS
SELECT
  COUNT(*) AS total_trainees,
  -- Workflow stage counts (from trainee_workflow)
  COUNT(*) FILTER (WHERE tw.current_stage = 'recruited') AS stage_recruited,
  COUNT(*) FILTER (WHERE tw.current_stage = 'trained') AS stage_trained,
  COUNT(*) FILTER (WHERE tw.current_stage = 'dormitory') AS stage_dormitory,
  COUNT(*) FILTER (WHERE tw.current_stage = 'visa_processing') AS stage_visa_processing,
  COUNT(*) FILTER (WHERE tw.current_stage = 'ready_to_depart') AS stage_ready_to_depart,
  COUNT(*) FILTER (WHERE tw.current_stage = 'departed') AS stage_departed,
  COUNT(*) FILTER (WHERE tw.current_stage = 'post_departure') AS stage_post_departure,
  COUNT(*) FILTER (WHERE tw.current_stage = 'archived') AS stage_archived,
  -- trainee_type enum values
  COUNT(*) FILTER (WHERE t.trainee_type = 'Thực tập sinh') AS type_tts,
  COUNT(*) FILTER (WHERE t.trainee_type = 'Kỹ năng đặc định') AS type_knd,
  COUNT(*) FILTER (WHERE t.trainee_type = 'Kỹ sư') AS type_engineer,
  COUNT(*) FILTER (WHERE t.trainee_type = 'Du học sinh') AS type_student,
  COUNT(*) FILTER (WHERE t.trainee_type = 'Thực tập sinh số 3') AS type_tts3,
  -- Time-based counts
  COUNT(*) FILTER (WHERE t.registration_date >= date_trunc('month', CURRENT_DATE)) AS registered_this_month,
  COUNT(*) FILTER (WHERE t.registration_date >= date_trunc('year', CURRENT_DATE)) AS registered_this_year,
  COUNT(*) FILTER (WHERE t.departure_date >= date_trunc('month', CURRENT_DATE)) AS departed_this_month,
  COUNT(*) FILTER (WHERE t.departure_date >= date_trunc('year', CURRENT_DATE)) AS departed_this_year
FROM public.trainees t
LEFT JOIN public.trainee_workflow tw ON t.id = tw.trainee_id;