-- =====================================================
-- PRODUCTION-READY SECURITY HARDENING
-- Tighten RLS policies for sensitive data tables
-- Only Manager+ can access family and personal data
-- =====================================================

-- 1. Drop old permissive policies and create strict ones for FAMILY_MEMBERS
DROP POLICY IF EXISTS "Staff+ can view family_members" ON public.family_members;
DROP POLICY IF EXISTS "Staff+ can insert family_members" ON public.family_members;
DROP POLICY IF EXISTS "Staff+ can update family_members" ON public.family_members;
DROP POLICY IF EXISTS "Managers+ can delete family_members" ON public.family_members;

-- Only Manager+ can access family data
CREATE POLICY "Manager+ can view family_members" ON public.family_members
  FOR SELECT TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can insert family_members" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can update family_members" ON public.family_members
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete family_members" ON public.family_members
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 2. JAPAN_RELATIVES - Only Manager+ can access
DROP POLICY IF EXISTS "Staff+ can view japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff+ can insert japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff+ can update japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Managers+ can delete japan_relatives" ON public.japan_relatives;

CREATE POLICY "Manager+ can view japan_relatives" ON public.japan_relatives
  FOR SELECT TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can insert japan_relatives" ON public.japan_relatives
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can update japan_relatives" ON public.japan_relatives
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete japan_relatives" ON public.japan_relatives
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 3. TEACHERS - Restrict contact info to Manager+ only
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Staff+ can insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "Staff+ can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers+ can delete teachers" ON public.teachers;

-- Create a view for teachers without sensitive contact info
CREATE OR REPLACE VIEW public.teachers_public 
WITH (security_invoker = on) AS
SELECT 
  id, code, full_name, specialty, status, 
  class_start_date, class_end_date, created_at, updated_at
  -- Excludes: email, phone (sensitive contact info)
FROM public.teachers;

-- Grant access to the view
GRANT SELECT ON public.teachers_public TO authenticated;

-- Only Manager+ can access full teacher data including contact info
CREATE POLICY "Manager+ can view teachers" ON public.teachers
  FOR SELECT TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can insert teachers" ON public.teachers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can update teachers" ON public.teachers
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete teachers" ON public.teachers
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 4. COMPANIES - Restrict contact info to Manager+ only
DROP POLICY IF EXISTS "Staff+ can view companies" ON public.companies;
DROP POLICY IF EXISTS "Staff+ can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Staff+ can update companies" ON public.companies;
DROP POLICY IF EXISTS "Managers+ can delete companies" ON public.companies;

-- Create view for companies without sensitive contact info
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT 
  id, code, name, name_japanese, country, status, 
  created_at, updated_at
  -- Excludes: email, phone, representative, address, position, notes, work_address
FROM public.companies;

GRANT SELECT ON public.companies_public TO authenticated;

-- Only Manager+ can access full company data
CREATE POLICY "Manager+ can view companies" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete companies" ON public.companies
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 5. TRAINEES - Create view without most sensitive fields for Staff/Teacher
DROP POLICY IF EXISTS "Staff+ can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "Staff+ can insert trainees" ON public.trainees;
DROP POLICY IF EXISTS "Staff+ can update trainees" ON public.trainees;
DROP POLICY IF EXISTS "Managers+ can delete trainees" ON public.trainees;

-- Create view for trainees with masked sensitive data (for Staff/Teacher)
CREATE OR REPLACE VIEW public.trainees_basic
WITH (security_invoker = on) AS
SELECT 
  id, trainee_code, full_name, furigana, gender, birth_date, 
  birthplace, ethnicity, class_id, progression_stage, simple_status,
  trainee_type, enrollment_status, education_level, marital_status,
  height, weight, vision_left, vision_right, blood_group, dominant_hand,
  smoking, drinking, tattoo, hobbies, health_status,
  registration_date, interview_pass_date, interview_count,
  expected_entry_month, entry_date, departure_date, return_date,
  expected_return_date, contract_term, contract_end_date,
  early_return_date, early_return_reason, absconded_date,
  current_situation, notes, photo_url,
  job_category_id, union_id, receiving_company_id,
  document_submission_date, otit_entry_date, nyukan_entry_date,
  coe_date, visa_date,
  created_at, updated_at
  -- Excludes: cccd_number, cccd_date, cccd_place, passport_number, passport_date
  -- phone, email, facebook, zalo, parent_phone_1, parent_phone_2
  -- permanent_address, current_address, temp_address, household_address, source
FROM public.trainees;

GRANT SELECT ON public.trainees_basic TO authenticated;

-- Staff+ can access basic trainee data
CREATE POLICY "Staff+ can view trainees" ON public.trainees
  FOR SELECT TO authenticated
  USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff+ can insert trainees" ON public.trainees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff+ can update trainees" ON public.trainees
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete trainees" ON public.trainees
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 6. UNION_MEMBERS - Only Manager+ can access
DROP POLICY IF EXISTS "Manager+ can view union_members" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ can insert union_members" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ can update union_members" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ can delete union_members" ON public.union_members;

CREATE POLICY "Manager+ only view union_members" ON public.union_members
  FOR SELECT TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ only insert union_members" ON public.union_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ only update union_members" ON public.union_members
  FOR UPDATE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "Manager+ only delete union_members" ON public.union_members
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- 7. PROFILES - Only own profile or Admin can view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users view own profile only" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users update own profile only" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System creates profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 8. Add audit trigger for sensitive table access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, description)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'ACCESS',
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    'Truy cập dữ liệu nhạy cảm từ bảng ' || TG_TABLE_NAME
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable audit on family_members and japan_relatives
DROP TRIGGER IF EXISTS audit_family_members_access ON public.family_members;
DROP TRIGGER IF EXISTS audit_japan_relatives_access ON public.japan_relatives;

CREATE TRIGGER audit_family_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

CREATE TRIGGER audit_japan_relatives_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.japan_relatives
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();