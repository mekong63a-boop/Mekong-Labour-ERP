-- 1) Quyền xem dữ liệu nhạy cảm của Học viên: SINGLE SOURCE OF TRUTH = menu permissions
-- Quy ước: ai có quyền UPDATE menu 'trainees' thì được xem PII (phone/cccd/passport/parent phones)
-- Lý do: tránh tạo thêm menu key mới (tránh luồng song song) và tận dụng tick quyền sẵn có.

CREATE OR REPLACE FUNCTION public.can_view_trainee_pii()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), 'trainees', 'update');
$$;

-- 2) Cập nhật view trainees_masked để mask dựa trên menu permission (KHÔNG dựa role)
CREATE OR REPLACE VIEW public.trainees_masked
WITH (security_invoker=on) AS
SELECT
  t.id,
  t.trainee_code,
  t.full_name,
  t.furigana,
  t.gender,
  t.birth_date,
  t.birthplace,
  t.ethnicity,
  t.marital_status,
  t.current_situation,
  t.source,
  t.education_level,
  t.religion,
  t.policy_category,

  CASE WHEN public.can_view_trainee_pii() THEN t.phone ELSE NULL::text END AS phone,
  t.zalo,
  t.facebook,
  t.email,

  CASE WHEN public.can_view_trainee_pii() THEN t.cccd_number ELSE NULL::text END AS cccd_number,
  t.cccd_date,
  t.cccd_place,

  CASE WHEN public.can_view_trainee_pii() THEN t.passport_number ELSE NULL::text END AS passport_number,
  t.passport_date,

  CASE WHEN public.can_view_trainee_pii() THEN t.parent_phone_1 ELSE NULL::text END AS parent_phone_1,
  CASE WHEN public.can_view_trainee_pii() THEN t.parent_phone_2 ELSE NULL::text END AS parent_phone_2,

  -- Địa chỉ luôn hiển thị cho mọi quyền theo yêu cầu trước đó
  t.temp_address,
  t.current_address,
  t.permanent_address,
  t.household_address,

  t.photo_url,
  t.height,
  t.weight,
  t.vision_left,
  t.vision_right,
  t.blood_group,
  t.dominant_hand,
  t.smoking,
  t.drinking,
  t.health_status,
  t.hobbies,
  t.tattoo,
  t.tattoo_description,
  t.trainee_type,
  t.progression_stage,
  t.simple_status,
  t.enrollment_status,
  t.class_id,
  t.receiving_company_id,
  t.union_id,
  t.job_category_id,
  t.expected_entry_month,
  t.interview_count,
  t.interview_pass_date,
  t.contract_term,
  t.registration_date,
  t.document_submission_date,
  t.otit_entry_date,
  t.nyukan_entry_date,
  t.coe_date,
  t.visa_date,
  t.departure_date,
  t.entry_date,
  t.return_date,
  t.expected_return_date,
  t.contract_end_date,
  t.absconded_date,
  t.early_return_date,
  t.early_return_reason,
  t.notes,
  t.created_at,
  t.updated_at
FROM public.trainees t;