
-- MIGRATION 2/2: Data fix + Trigger + Views

-- Fix dữ liệu cũ có 'Đã đậu' (từ trigger cũ) sang 'DaDau'
UPDATE public.trainees SET simple_status = 'DaDau' WHERE simple_status = 'Đã đậu';

-- Trigger Single Flow 2 chiều
CREATE OR REPLACE FUNCTION public.sync_trainee_on_interview_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- CHIỀU THUẬN
  IF NEW.result = 'Đã đậu' AND (OLD IS NULL OR OLD.result IS DISTINCT FROM 'Đã đậu') THEN
    UPDATE public.trainees
    SET
      receiving_company_id = COALESCE(NEW.company_id, receiving_company_id),
      union_id = COALESCE(NEW.union_id, trainees.union_id),
      job_category_id = COALESCE(NEW.job_category_id, trainees.job_category_id),
      progression_stage = 'DauPV',
      simple_status = 'DaDau',
      interview_pass_date = COALESCE(NEW.interview_date, CURRENT_DATE),
      updated_at = now()
    WHERE id = NEW.trainee_id;
  END IF;

  -- CHIỀU NGHỊCH (Rollback)
  IF OLD IS NOT NULL AND OLD.result = 'Đã đậu' AND NEW.result IS DISTINCT FROM 'Đã đậu' THEN
    UPDATE public.trainees
    SET
      receiving_company_id = NULL,
      union_id = NULL,
      job_category_id = NULL,
      interview_pass_date = NULL,
      progression_stage = 'ChuaDau',
      simple_status = 'DangKyMoi',
      updated_at = now()
    WHERE id = NEW.trainee_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_trainee_on_interview_pass ON public.interview_history;
CREATE TRIGGER trigger_sync_trainee_on_interview_pass
  AFTER INSERT OR UPDATE OF result
  ON public.interview_history
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trainee_on_interview_pass();

-- Recreate views
DROP VIEW IF EXISTS public.trainee_stage_counts;
CREATE OR REPLACE VIEW public.trainee_stage_counts AS
SELECT progression_stage, count(*) AS count
FROM public.trainees
WHERE progression_stage IS NOT NULL
GROUP BY progression_stage;

DROP VIEW IF EXISTS public.education_interview_stats;
CREATE OR REPLACE VIEW public.education_interview_stats AS
SELECT
  count(*) FILTER (WHERE t.simple_status = 'DaDau' AND t.gender = 'Nam') AS passed_male,
  count(*) FILTER (WHERE t.simple_status = 'DaDau' AND t.gender = 'Nữ') AS passed_female,
  count(*) FILTER (WHERE t.simple_status = 'DaDau') AS passed_total,
  count(*) FILTER (WHERE (t.simple_status IS NULL OR t.simple_status != 'DaDau') AND t.gender = 'Nam') AS not_passed_male,
  count(*) FILTER (WHERE (t.simple_status IS NULL OR t.simple_status != 'DaDau') AND t.gender = 'Nữ') AS not_passed_female,
  count(*) FILTER (WHERE t.simple_status IS NULL OR t.simple_status != 'DaDau') AS not_passed_total
FROM public.trainees t
WHERE t.enrollment_status = 'Đang học';
