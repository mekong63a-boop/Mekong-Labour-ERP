CREATE OR REPLACE FUNCTION public.auto_create_trainee_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage trainee_workflow_stage;
BEGIN
  -- Map simple_status to correct workflow stage instead of hardcoding 'recruited'
  v_stage := CASE NEW.simple_status
    WHEN 'Đăng ký mới' THEN 'registered'::trainee_workflow_stage
    WHEN 'Đang học' THEN 'training'::trainee_workflow_stage
    WHEN 'Dừng chương trình' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Hủy' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Không học' THEN 'terminated'::trainee_workflow_stage
    WHEN 'Bảo lưu' THEN 'registered'::trainee_workflow_stage
    WHEN 'Đang ở Nhật' THEN 'departed'::trainee_workflow_stage
    WHEN 'Rời công ty' THEN 'terminated'::trainee_workflow_stage
    ELSE 'registered'::trainee_workflow_stage
  END;

  INSERT INTO trainee_workflow (trainee_id, current_stage, created_at, updated_at)
  VALUES (NEW.id, v_stage, NOW(), NOW())
  ON CONFLICT (trainee_id) DO NOTHING;
  RETURN NEW;
END;
$$;