
-- Update masking policy: Nhân viên (staff thường) KHÔNG xem được 5 trường:
-- phone, parent_phone_1, parent_phone_2, cccd_number, passport_number
-- Các trường khác (email, địa chỉ, v.v.) vẫn hiển thị bình thường.

DROP VIEW IF EXISTS public.trainees_masked;

CREATE VIEW public.trainees_masked
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

  CASE WHEN is_regular_staff() THEN NULL::text ELSE t.phone END AS phone,
  t.zalo,
  t.facebook,
  t.email,

  CASE WHEN is_regular_staff() THEN NULL::text ELSE t.cccd_number END AS cccd_number,
  t.cccd_date,
  t.cccd_place,

  CASE WHEN is_regular_staff() THEN NULL::text ELSE t.passport_number END AS passport_number,
  t.passport_date,

  CASE WHEN is_regular_staff() THEN NULL::text ELSE t.parent_phone_1 END AS parent_phone_1,
  CASE WHEN is_regular_staff() THEN NULL::text ELSE t.parent_phone_2 END AS parent_phone_2,

  -- Địa chỉ luôn hiển thị cho mọi role theo yêu cầu
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

GRANT SELECT ON public.trainees_masked TO authenticated;
