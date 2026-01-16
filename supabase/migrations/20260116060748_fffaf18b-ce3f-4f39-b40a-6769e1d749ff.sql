-- =====================================================
-- FIX REMAINING SECURITY WARNINGS
-- =====================================================

-- 1. Fix login_attempts - add rate limiting in trigger to prevent DoS
CREATE OR REPLACE FUNCTION public.rate_limit_login_inserts()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count inserts from same identifier in last 5 minutes
  SELECT COUNT(*) INTO recent_count
  FROM public.login_attempts
  WHERE identifier = NEW.identifier
    AND attempt_time > now() - INTERVAL '5 minutes';
  
  -- Block if more than 50 attempts in 5 minutes (likely DoS)
  IF recent_count > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded for login attempts';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS rate_limit_login_inserts ON public.login_attempts;
CREATE TRIGGER rate_limit_login_inserts
  BEFORE INSERT ON public.login_attempts
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_login_inserts();

-- 2. Improve audit_logs - mask sensitive fields in trigger
CREATE OR REPLACE FUNCTION public.mask_audit_sensitive_fields(data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  sensitive_keys TEXT[] := ARRAY['password', 'password_hash', 'cccd_number', 'passport_number', 'phone', 'email', 'parent_phone_1', 'parent_phone_2', 'api_key', 'secret'];
  key TEXT;
BEGIN
  result := data;
  
  FOREACH key IN ARRAY sensitive_keys
  LOOP
    IF result ? key THEN
      result := jsonb_set(result, ARRAY[key], '"[MASKED]"'::jsonb);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Update audit trigger to mask sensitive data
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id::TEXT,
      public.mask_audit_sensitive_fields(to_jsonb(OLD)),
      'Xóa bản ghi từ bảng ' || TG_TABLE_NAME
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      public.mask_audit_sensitive_fields(to_jsonb(OLD)),
      public.mask_audit_sensitive_fields(to_jsonb(NEW)),
      'Cập nhật bản ghi trong bảng ' || TG_TABLE_NAME
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::TEXT,
      public.mask_audit_sensitive_fields(to_jsonb(NEW)),
      'Thêm mới bản ghi vào bảng ' || TG_TABLE_NAME
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Remove permissive policies that might remain (USING true for INSERT/UPDATE/DELETE)
-- Check and fix katakana_names policies
DROP POLICY IF EXISTS "Authenticated users can insert katakana_names" ON public.katakana_names;
DROP POLICY IF EXISTS "Staff+ can update katakana_names" ON public.katakana_names;
DROP POLICY IF EXISTS "Managers+ can delete katakana_names" ON public.katakana_names;

CREATE POLICY "Staff+ can insert katakana_names" ON public.katakana_names
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff+ can update katakana_names" ON public.katakana_names
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete katakana_names" ON public.katakana_names
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- Fix referral_sources policies
DROP POLICY IF EXISTS "Authenticated users can insert referral_sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Staff+ can update referral_sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Managers+ can delete referral_sources" ON public.referral_sources;

CREATE POLICY "Staff+ can insert referral_sources" ON public.referral_sources
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff+ can update referral_sources" ON public.referral_sources
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete referral_sources" ON public.referral_sources
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));

-- Fix vocabulary policies
DROP POLICY IF EXISTS "Authenticated users can insert vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Staff+ can update vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Managers+ can delete vocabulary" ON public.vocabulary;

CREATE POLICY "Staff+ can insert vocabulary" ON public.vocabulary
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff+ can update vocabulary" ON public.vocabulary
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Manager+ can delete vocabulary" ON public.vocabulary
  FOR DELETE TO authenticated
  USING (public.is_manager_or_higher(auth.uid()));