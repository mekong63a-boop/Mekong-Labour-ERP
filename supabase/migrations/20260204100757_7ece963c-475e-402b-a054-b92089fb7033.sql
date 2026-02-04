-- Update the trigger function with CORRECT simple_status enum values
-- Available values: 'Đăng ký mới', 'Đang học', 'Bảo lưu', 'Dừng chương trình', 'Không học', 'Hủy', 'Đang ở Nhật', 'Rời công ty'

CREATE OR REPLACE FUNCTION sync_trainee_status_from_workflow()
RETURNS TRIGGER AS $$
DECLARE
  v_mapped_simple_status simple_status;
BEGIN
  -- Map workflow stage to simple_status using correct enum values
  v_mapped_simple_status := CASE NEW.current_stage
    WHEN 'registered' THEN 'Đăng ký mới'::simple_status
    WHEN 'enrolled' THEN 'Đang học'::simple_status
    WHEN 'training' THEN 'Đang học'::simple_status
    WHEN 'interview_passed' THEN 'Đang học'::simple_status
    WHEN 'document_processing' THEN 'Đang học'::simple_status
    WHEN 'ready_to_depart' THEN 'Đang học'::simple_status
    WHEN 'departed' THEN 'Đang ở Nhật'::simple_status
    WHEN 'post_departure' THEN 'Đang ở Nhật'::simple_status
    WHEN 'terminated' THEN 'Dừng chương trình'::simple_status
    -- Legacy values for backwards compatibility
    WHEN 'recruited' THEN 'Đăng ký mới'::simple_status
    WHEN 'trained' THEN 'Đang học'::simple_status
    WHEN 'visa_processing' THEN 'Đang học'::simple_status
    WHEN 'archived' THEN 'Dừng chương trình'::simple_status
    ELSE 'Đang học'::simple_status
  END;
  
  -- Update the trainee's simple_status
  UPDATE trainees
  SET simple_status = v_mapped_simple_status,
      updated_at = now()
  WHERE id = NEW.trainee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Now update existing records to use new enum values
UPDATE trainee_workflow SET current_stage = 'registered' WHERE current_stage = 'recruited';
UPDATE trainee_workflow SET current_stage = 'training' WHERE current_stage = 'trained';
UPDATE trainee_workflow SET current_stage = 'document_processing' WHERE current_stage = 'visa_processing';
UPDATE trainee_workflow SET current_stage = 'terminated' WHERE current_stage = 'archived';

-- Update history table - to_stage
UPDATE trainee_workflow_history SET to_stage = 'registered' WHERE to_stage = 'recruited';
UPDATE trainee_workflow_history SET to_stage = 'training' WHERE to_stage = 'trained';
UPDATE trainee_workflow_history SET to_stage = 'document_processing' WHERE to_stage = 'visa_processing';
UPDATE trainee_workflow_history SET to_stage = 'terminated' WHERE to_stage = 'archived';

-- Update history table - from_stage
UPDATE trainee_workflow_history SET from_stage = 'registered' WHERE from_stage = 'recruited';
UPDATE trainee_workflow_history SET from_stage = 'training' WHERE from_stage = 'trained';
UPDATE trainee_workflow_history SET from_stage = 'document_processing' WHERE from_stage = 'visa_processing';
UPDATE trainee_workflow_history SET from_stage = 'terminated' WHERE from_stage = 'archived';

-- Set default stage for new trainees as 'registered'
ALTER TABLE trainee_workflow ALTER COLUMN current_stage SET DEFAULT 'registered';