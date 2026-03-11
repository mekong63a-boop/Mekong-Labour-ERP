-- 1. Thêm giá trị 'Đã đậu' vào enum simple_status
ALTER TYPE public.simple_status ADD VALUE IF NOT EXISTS 'Đã đậu';

-- 2. Tạo function cho trigger
CREATE OR REPLACE FUNCTION public.sync_trainee_on_interview_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Chỉ xử lý khi result = 'Đã đậu'
  IF NEW.result = 'Đã đậu' THEN
    UPDATE public.trainees
    SET
      receiving_company_id = COALESCE(NEW.company_id, receiving_company_id),
      union_id = COALESCE(NEW.union_id, trainees.union_id),
      job_category_id = COALESCE(NEW.job_category_id, trainees.job_category_id),
      progression_stage = 'Đậu phỏng vấn',
      simple_status = 'Đã đậu',
      interview_pass_date = COALESCE(NEW.interview_date, CURRENT_DATE),
      updated_at = now()
    WHERE id = NEW.trainee_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Tạo trigger trên bảng interview_history
CREATE TRIGGER trigger_sync_trainee_on_interview_pass
  AFTER INSERT OR UPDATE OF result
  ON public.interview_history
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trainee_on_interview_pass();