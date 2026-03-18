
-- ============================================================
-- SOFT DELETE: Add deleted_at columns to trainees + related tables
-- ============================================================

-- 1. Add deleted_at column to trainees
ALTER TABLE public.trainees ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_trainees_deleted_at ON public.trainees(deleted_at) WHERE deleted_at IS NULL;

-- 2. Add deleted_at column to family_members
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 3. Add deleted_at column to education_history
ALTER TABLE public.education_history ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 4. Add deleted_at column to work_history
ALTER TABLE public.work_history ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 5. Add deleted_at column to japan_relatives
ALTER TABLE public.japan_relatives ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 6. Create soft_delete_trainee function that marks trainee + related records
CREATE OR REPLACE FUNCTION public.soft_delete_trainee(p_trainee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Check permission: must be admin or have delete permission on trainees
  IF NOT (is_admin(v_user_id) OR can_delete('trainees')) THEN
    RAISE EXCEPTION 'Không có quyền xóa học viên';
  END IF;

  -- Soft delete the trainee
  UPDATE public.trainees 
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_trainee_id AND deleted_at IS NULL;

  -- Soft delete related records
  UPDATE public.family_members SET deleted_at = now() WHERE trainee_id = p_trainee_id AND deleted_at IS NULL;
  UPDATE public.education_history SET deleted_at = now() WHERE trainee_id = p_trainee_id AND deleted_at IS NULL;
  UPDATE public.work_history SET deleted_at = now() WHERE trainee_id = p_trainee_id AND deleted_at IS NULL;
  UPDATE public.japan_relatives SET deleted_at = now() WHERE trainee_id = p_trainee_id AND deleted_at IS NULL;
END;
$$;

-- 7. Create restore function
CREATE OR REPLACE FUNCTION public.restore_trainee(p_trainee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Only admin can restore
  IF NOT is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Chỉ Admin mới có thể khôi phục học viên đã xóa';
  END IF;

  UPDATE public.trainees SET deleted_at = NULL, updated_at = now() WHERE id = p_trainee_id;
  UPDATE public.family_members SET deleted_at = NULL WHERE trainee_id = p_trainee_id;
  UPDATE public.education_history SET deleted_at = NULL WHERE trainee_id = p_trainee_id;
  UPDATE public.work_history SET deleted_at = NULL WHERE trainee_id = p_trainee_id;
  UPDATE public.japan_relatives SET deleted_at = NULL WHERE trainee_id = p_trainee_id;
END;
$$;

-- 8. Create trainees_masked view for PII protection
-- Staff who can view trainees but NOT update will see masked PII
CREATE OR REPLACE VIEW public.trainees_masked
WITH (security_invoker = true)
AS
SELECT
  id, trainee_code, full_name, furigana, gender, birth_date, birthplace,
  -- Mask PII fields unless user has PII access
  CASE WHEN can_view_trainee_pii() THEN phone ELSE '***' || RIGHT(COALESCE(phone, ''), 3) END AS phone,
  CASE WHEN can_view_trainee_pii() THEN cccd_number ELSE '***' || RIGHT(COALESCE(cccd_number, ''), 4) END AS cccd_number,
  CASE WHEN can_view_trainee_pii() THEN cccd_date ELSE NULL END AS cccd_date,
  CASE WHEN can_view_trainee_pii() THEN cccd_place ELSE NULL END AS cccd_place,
  CASE WHEN can_view_trainee_pii() THEN passport_number ELSE '***' || RIGHT(COALESCE(passport_number, ''), 4) END AS passport_number,
  CASE WHEN can_view_trainee_pii() THEN passport_date ELSE NULL END AS passport_date,
  CASE WHEN can_view_trainee_pii() THEN passport_place ELSE NULL END AS passport_place,
  CASE WHEN can_view_trainee_pii() THEN email ELSE NULL END AS email,
  CASE WHEN can_view_trainee_pii() THEN photo_url ELSE NULL END AS photo_url,
  CASE WHEN can_view_trainee_pii() THEN line_qr_url ELSE NULL END AS line_qr_url,
  -- Non-PII fields always visible
  ethnicity, religion, marital_status, education_level,
  current_address, permanent_address, permanent_address_new, household_address, temp_address,
  height, weight, blood_group, vision_left, vision_right, dominant_hand,
  glasses, hearing, tattoo, tattoo_description, smoking, drinking,
  health_status, hepatitis_b,
  hobbies, personality, tidiness, greeting_attitude, class_attitude, discipline,
  shirt_size, pants_size, shoe_size,
  high_school_name, high_school_period,
  japanese_certificate, jp_certificate_school, jp_certificate_period,
  jp_school_1, jp_course_1, jp_school_2, jp_course_2,
  ssw_certificate,
  source, facebook, zalo,
  parent_phone_1, parent_phone_1_relation,
  parent_phone_2, parent_phone_2_relation,
  parent_phone_3, parent_phone_3_relation,
  registration_date, trainee_type, progression_stage, simple_status,
  class_id, receiving_company_id, union_id, job_category_id,
  interview_pass_date, interview_count, expected_entry_month,
  document_status, document_submission_date,
  coe_date, visa_date, departure_date, entry_date,
  nyukan_entry_date, otit_entry_date,
  contract_term, contract_end_date, expected_return_date,
  return_date, early_return_date, early_return_reason,
  settlement_date, absconded_date, cancel_date, stop_date, reserve_date,
  current_situation, enrollment_status,
  legal_address_vn, legal_address_jp,
  guarantor_name_vn, guarantor_name_jp, guarantor_phone,
  recommending_company_name, recommending_representative, recommending_position,
  policy_category, prior_residence_status, gender_identity,
  dkhd_code, dkhd_number, dkhd_date,
  ptl_number, ptl_date,
  tpc_code, tpc_cv_number, tpc_request_date, tpc_issue_date,
  rirekisho_remarks, notes,
  is_locked, locked_at,
  created_at, updated_at, deleted_at
FROM public.trainees
WHERE deleted_at IS NULL;
