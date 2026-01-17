-- =====================================================
-- BẢO MẬT CHE GIẤU DỮ LIỆU NHẠY CẢM
-- =====================================================

-- 1. Tạo hàm kiểm tra user có phải Senior Staff hoặc Admin không
CREATE OR REPLACE FUNCTION public.current_user_is_senior()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin luôn được xem dữ liệu thực
  IF is_admin(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Kiểm tra is_senior_staff trong user_roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND is_senior_staff = true
  );
END;
$$;

-- 2. Tạo hàm mask dữ liệu
CREATE OR REPLACE FUNCTION public.mask_phone(phone_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone_value IS NULL OR length(phone_value) < 4 THEN
    RETURN phone_value;
  END IF;
  -- Hiển thị 3 số đầu và 2 số cuối, che giấu phần giữa
  -- VD: 0912345678 -> 091****78
  RETURN left(phone_value, 3) || '****' || right(phone_value, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_cccd(cccd_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF cccd_value IS NULL OR length(cccd_value) < 4 THEN
    RETURN cccd_value;
  END IF;
  -- Hiển thị 3 số đầu và 3 số cuối, che giấu phần giữa
  -- VD: 079123456789 -> 079******789
  RETURN left(cccd_value, 3) || '******' || right(cccd_value, 3);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_passport(passport_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF passport_value IS NULL OR length(passport_value) < 4 THEN
    RETURN passport_value;
  END IF;
  -- Hiển thị 2 ký tự đầu và 2 ký tự cuối
  -- VD: B12345678 -> B1*****78
  RETURN left(passport_value, 2) || '*****' || right(passport_value, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  at_pos integer;
  local_part text;
  domain_part text;
BEGIN
  IF email_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  at_pos := position('@' in email_value);
  IF at_pos = 0 THEN
    RETURN email_value;
  END IF;
  
  local_part := left(email_value, at_pos - 1);
  domain_part := substring(email_value from at_pos);
  
  -- Hiển thị 2 ký tự đầu của local part
  -- VD: nguyen.van.a@gmail.com -> ng****@gmail.com
  IF length(local_part) <= 2 THEN
    RETURN local_part || '****' || domain_part;
  END IF;
  
  RETURN left(local_part, 2) || '****' || domain_part;
END;
$$;

-- 3. Tạo view trainees_masked với logic che giấu
CREATE OR REPLACE VIEW public.trainees_masked AS
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
    ELSE NULL -- Hoàn toàn ẩn facebook
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
  
  -- Dữ liệu không nhạy cảm - hiển thị bình thường
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
  
  -- Thông tin công việc
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
  
  -- Các ngày quan trọng
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

-- 4. Cấp quyền cho view
GRANT SELECT ON public.trainees_masked TO authenticated;

-- 5. Tạo RLS policy cho view (views inherit từ base table)
-- View tự động sử dụng RLS của bảng trainees

COMMENT ON VIEW public.trainees_masked IS 'View che giấu dữ liệu nhạy cảm cho nhân viên thường. Admin và Senior Staff xem được dữ liệu thực.';
COMMENT ON FUNCTION public.current_user_is_senior() IS 'Kiểm tra user hiện tại có phải Admin hoặc Senior Staff không';
COMMENT ON FUNCTION public.mask_phone(text) IS 'Che giấu số điện thoại: 091****78';
COMMENT ON FUNCTION public.mask_cccd(text) IS 'Che giấu CCCD: 079******789';
COMMENT ON FUNCTION public.mask_passport(text) IS 'Che giấu passport: B1*****78';
COMMENT ON FUNCTION public.mask_email(text) IS 'Che giấu email: ng****@gmail.com';