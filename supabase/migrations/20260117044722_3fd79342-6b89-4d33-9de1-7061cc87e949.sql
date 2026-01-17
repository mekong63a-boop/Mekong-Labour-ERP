-- Sửa lỗi Security Definer View bằng cách thêm SECURITY INVOKER
DROP VIEW IF EXISTS public.trainees_masked;

CREATE VIEW public.trainees_masked 
WITH (security_invoker = true)
AS
SELECT
  id,
  trainee_code,
  full_name,
  furigana,
  gender,
  birth_date,
  birthplace,
  ethnicity,
  marital_status,
  current_situation,
  source,
  education_level,
  religion,
  policy_category,
  
  -- Dữ liệu nhạy cảm - che giấu nếu không phải Senior
  CASE 
    WHEN current_user_is_senior() THEN phone
    ELSE mask_phone(phone)
  END AS phone,
  
  CASE 
    WHEN current_user_is_senior() THEN zalo
    ELSE mask_phone(zalo)
  END AS zalo,
  
  CASE 
    WHEN current_user_is_senior() THEN facebook
    ELSE NULL
  END AS facebook,
  
  CASE 
    WHEN current_user_is_senior() THEN email
    ELSE mask_email(email)
  END AS email,
  
  CASE 
    WHEN current_user_is_senior() THEN cccd_number
    ELSE mask_cccd(cccd_number)
  END AS cccd_number,
  
  CASE 
    WHEN current_user_is_senior() THEN cccd_date
    ELSE NULL
  END AS cccd_date,
  
  CASE 
    WHEN current_user_is_senior() THEN cccd_place
    ELSE NULL
  END AS cccd_place,
  
  CASE 
    WHEN current_user_is_senior() THEN passport_number
    ELSE mask_passport(passport_number)
  END AS passport_number,
  
  CASE 
    WHEN current_user_is_senior() THEN passport_date
    ELSE NULL
  END AS passport_date,
  
  CASE 
    WHEN current_user_is_senior() THEN parent_phone_1
    ELSE mask_phone(parent_phone_1)
  END AS parent_phone_1,
  
  CASE 
    WHEN current_user_is_senior() THEN parent_phone_2
    ELSE mask_phone(parent_phone_2)
  END AS parent_phone_2,
  
  CASE 
    WHEN current_user_is_senior() THEN temp_address
    ELSE '***ẨN***'
  END AS temp_address,
  
  CASE 
    WHEN current_user_is_senior() THEN current_address
    ELSE '***ẨN***'
  END AS current_address,
  
  CASE 
    WHEN current_user_is_senior() THEN permanent_address
    ELSE '***ẨN***'
  END AS permanent_address,
  
  CASE 
    WHEN current_user_is_senior() THEN household_address
    ELSE '***ẨN***'
  END AS household_address,
  
  -- Dữ liệu không nhạy cảm
  photo_url,
  height,
  weight,
  vision_left,
  vision_right,
  blood_group,
  dominant_hand,
  smoking,
  drinking,
  health_status,
  hobbies,
  tattoo,
  tattoo_description,
  
  trainee_type,
  progression_stage,
  simple_status,
  enrollment_status,
  class_id,
  receiving_company_id,
  union_id,
  job_category_id,
  expected_entry_month,
  interview_count,
  interview_pass_date,
  contract_term,
  
  registration_date,
  document_submission_date,
  otit_entry_date,
  nyukan_entry_date,
  coe_date,
  visa_date,
  departure_date,
  entry_date,
  return_date,
  expected_return_date,
  contract_end_date,
  absconded_date,
  early_return_date,
  early_return_reason,
  
  notes,
  created_at,
  updated_at
FROM public.trainees;

GRANT SELECT ON public.trainees_masked TO authenticated;