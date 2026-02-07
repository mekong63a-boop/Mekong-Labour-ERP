-- Drop and recreate function to accept partner IDs directly
DROP FUNCTION IF EXISTS finalize_interview_draft(uuid, date, text);

CREATE OR REPLACE FUNCTION public.finalize_interview_draft(
  p_trainee_id uuid,
  p_interview_date date,
  p_result text DEFAULT NULL,
  p_company_id uuid DEFAULT NULL,
  p_union_id uuid DEFAULT NULL,
  p_job_category_id uuid DEFAULT NULL,
  p_expected_entry_month text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_interview_id uuid;
  v_company_id uuid;
  v_union_id uuid;
  v_job_category_id uuid;
  v_expected_entry_month text;
BEGIN
  -- Get current trainee data as fallback
  SELECT 
    COALESCE(p_company_id, receiving_company_id),
    COALESCE(p_union_id, union_id),
    COALESCE(p_job_category_id, job_category_id),
    COALESCE(p_expected_entry_month, expected_entry_month)
  INTO v_company_id, v_union_id, v_job_category_id, v_expected_entry_month
  FROM trainees
  WHERE id = p_trainee_id;

  -- Insert interview history with provided or fallback values
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
  VALUES (
    p_trainee_id,
    v_company_id,
    v_union_id,
    v_job_category_id,
    p_interview_date,
    v_expected_entry_month,
    p_result,
    now()
  )
  RETURNING id INTO v_interview_id;

  RETURN v_interview_id;
END;
$$;