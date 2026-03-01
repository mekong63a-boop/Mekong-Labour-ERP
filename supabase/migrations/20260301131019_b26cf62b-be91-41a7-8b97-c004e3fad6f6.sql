
-- Step 1: Clean up duplicates - keep the record with most data (prefer non-null company_id, latest created_at)
DELETE FROM interview_history
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY trainee_id, interview_date
        ORDER BY 
          (CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
          created_at DESC
      ) as rn
    FROM interview_history
    WHERE (trainee_id, interview_date) IN (
      SELECT trainee_id, interview_date 
      FROM interview_history 
      GROUP BY trainee_id, interview_date 
      HAVING count(*) > 1
    )
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add UNIQUE constraint
ALTER TABLE interview_history
ADD CONSTRAINT uq_interview_trainee_date UNIQUE (trainee_id, interview_date);

-- Step 3: Replace RPC with UPSERT logic
CREATE OR REPLACE FUNCTION finalize_interview_draft(
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
SET search_path = public
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

  -- UPSERT: insert or update if same trainee+date exists
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
  ON CONFLICT (trainee_id, interview_date)
  DO UPDATE SET
    company_id = COALESCE(EXCLUDED.company_id, interview_history.company_id),
    union_id = COALESCE(EXCLUDED.union_id, interview_history.union_id),
    job_category_id = COALESCE(EXCLUDED.job_category_id, interview_history.job_category_id),
    expected_entry_month = COALESCE(EXCLUDED.expected_entry_month, interview_history.expected_entry_month),
    result = COALESCE(EXCLUDED.result, interview_history.result)
  RETURNING id INTO v_interview_id;

  RETURN v_interview_id;
END;
$$;
