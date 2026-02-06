
-- 1. Create RPC to finalize interview draft into history
CREATE OR REPLACE FUNCTION public.finalize_interview_draft(
  p_trainee_id uuid,
  p_interview_date date,
  p_result text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interview_id uuid;
BEGIN
  -- Insert new interview history record
  INSERT INTO interview_history (
    trainee_id,
    company_id,
    union_id,
    job_category_id,
    interview_date,
    expected_entry_month,
    result,
    created_at
  )
  SELECT
    p_trainee_id,
    receiving_company_id,
    union_id,
    job_category_id,
    p_interview_date,
    expected_entry_month,
    p_result,
    now()
  FROM trainees
  WHERE id = p_trainee_id
  RETURNING id INTO v_interview_id;

  RETURN v_interview_id;
END;
$$;

-- 2. Create view to derive interview_count from interview_history
CREATE OR REPLACE VIEW public.v_trainee_interview_count AS
SELECT
  trainee_id,
  COUNT(*) as interview_count
FROM interview_history
GROUP BY trainee_id;

-- 3. Create trigger to auto-update trainee.interview_count
CREATE OR REPLACE FUNCTION public.fn_update_trainee_interview_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE trainees
  SET interview_count = (
    SELECT COALESCE(COUNT(*), 0)
    FROM interview_history
    WHERE trainee_id = NEW.trainee_id
  )
  WHERE id = NEW.trainee_id;
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trg_update_interview_count ON interview_history;

CREATE TRIGGER trg_update_interview_count
AFTER INSERT OR DELETE ON interview_history
FOR EACH ROW
EXECUTE FUNCTION fn_update_trainee_interview_count();
