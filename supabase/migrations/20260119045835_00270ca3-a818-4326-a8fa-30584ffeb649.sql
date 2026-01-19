
-- Sửa logic masking: CHỈ role='staff' VÀ is_senior_staff=false mới bị ẩn
-- Admin và senior_staff đều thấy đầy đủ thông tin

-- Tạo lại function để kiểm tra xem user có phải là nhân viên thường không
CREATE OR REPLACE FUNCTION public.is_regular_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nếu là admin -> không phải nhân viên thường
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  -- Nếu là senior_staff -> không phải nhân viên thường
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND is_senior_staff = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Nếu là staff thường (role='staff' và is_senior_staff=false) -> là nhân viên thường
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'staff'
    AND (is_senior_staff = false OR is_senior_staff IS NULL)
  ) THEN
    RETURN true;
  END IF;
  
  -- Mặc định: không phải nhân viên thường (có thể xem)
  RETURN false;
END;
$$;

-- Sửa function current_user_is_senior để đúng logic:
-- TRUE = được xem thông tin nhạy cảm (admin, senior_staff, hoặc không có role)
-- FALSE = bị ẩn thông tin (chỉ staff thường)
CREATE OR REPLACE FUNCTION public.current_user_is_senior()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ngược lại với is_regular_staff
  -- Nếu là nhân viên thường -> không được xem -> return FALSE
  -- Ngược lại -> được xem -> return TRUE
  RETURN NOT is_regular_staff();
END;
$$;

-- Cập nhật view trainees_masked với logic mới
DROP VIEW IF EXISTS trainees_masked;

CREATE VIEW public.trainees_masked
WITH (security_invoker=on) AS
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
    -- SĐT: chỉ staff thường bị ẩn
    CASE
        WHEN is_regular_staff() THEN mask_phone(phone)
        ELSE phone
    END AS phone,
    -- Zalo
    CASE
        WHEN is_regular_staff() THEN mask_phone(zalo)
        ELSE zalo
    END AS zalo,
    -- Facebook
    CASE
        WHEN is_regular_staff() THEN NULL
        ELSE facebook
    END AS facebook,
    -- Email
    CASE
        WHEN is_regular_staff() THEN mask_email(email)
        ELSE email
    END AS email,
    -- CCCD
    CASE
        WHEN is_regular_staff() THEN mask_cccd(cccd_number)
        ELSE cccd_number
    END AS cccd_number,
    CASE
        WHEN is_regular_staff() THEN NULL
        ELSE cccd_date
    END AS cccd_date,
    CASE
        WHEN is_regular_staff() THEN NULL
        ELSE cccd_place
    END AS cccd_place,
    -- Hộ chiếu
    CASE
        WHEN is_regular_staff() THEN mask_passport(passport_number)
        ELSE passport_number
    END AS passport_number,
    CASE
        WHEN is_regular_staff() THEN NULL
        ELSE passport_date
    END AS passport_date,
    -- SĐT phụ huynh
    CASE
        WHEN is_regular_staff() THEN mask_phone(parent_phone_1)
        ELSE parent_phone_1
    END AS parent_phone_1,
    CASE
        WHEN is_regular_staff() THEN mask_phone(parent_phone_2)
        ELSE parent_phone_2
    END AS parent_phone_2,
    -- Địa chỉ - KHÔNG ẨN nữa theo yêu cầu mới
    temp_address,
    current_address,
    permanent_address,
    household_address,
    -- Các trường còn lại
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
FROM trainees;

-- Grant quyền cho view
GRANT SELECT ON public.trainees_masked TO authenticated;
