-- ============================================
-- SECURITY HARDENING: Siết chặt RLS cho các bảng còn lại
-- ============================================

-- 1. ATTENDANCE table - Teachers and admin can manage
DROP POLICY IF EXISTS "Allow public read access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users to manage attendance" ON public.attendance;

CREATE POLICY "Authenticated users can view attendance" 
ON public.attendance FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Teachers and admin can insert attendance" 
ON public.attendance FOR INSERT 
TO authenticated 
WITH CHECK (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers and admin can update attendance" 
ON public.attendance FOR UPDATE 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admin can delete attendance" 
ON public.attendance FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 2. TEST_SCORES table
DROP POLICY IF EXISTS "Allow public read access to test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Allow authenticated users to manage test_scores" ON public.test_scores;

CREATE POLICY "Authenticated users can view test_scores" 
ON public.test_scores FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Teachers and admin can insert test_scores" 
ON public.test_scores FOR INSERT 
TO authenticated 
WITH CHECK (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers and admin can update test_scores" 
ON public.test_scores FOR UPDATE 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admin can delete test_scores" 
ON public.test_scores FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 3. FAMILY_MEMBERS table
DROP POLICY IF EXISTS "Allow public read access to family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow authenticated users to manage family_members" ON public.family_members;

CREATE POLICY "Authenticated users can view family_members" 
ON public.family_members FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage family_members" 
ON public.family_members FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff')
);

-- 4. EDUCATION_HISTORY table
DROP POLICY IF EXISTS "Allow public read access to education_history" ON public.education_history;
DROP POLICY IF EXISTS "Allow authenticated users to manage education_history" ON public.education_history;

CREATE POLICY "Authenticated users can view education_history" 
ON public.education_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage education_history" 
ON public.education_history FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff')
);

-- 5. WORK_HISTORY table
DROP POLICY IF EXISTS "Allow public read access to work_history" ON public.work_history;
DROP POLICY IF EXISTS "Allow authenticated users to manage work_history" ON public.work_history;

CREATE POLICY "Authenticated users can view work_history" 
ON public.work_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage work_history" 
ON public.work_history FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff')
);

-- 6. JAPAN_RELATIVES table
DROP POLICY IF EXISTS "Allow public read access to japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Allow authenticated users to manage japan_relatives" ON public.japan_relatives;

CREATE POLICY "Authenticated users can view japan_relatives" 
ON public.japan_relatives FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage japan_relatives" 
ON public.japan_relatives FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff')
);

-- 7. JOB_CATEGORIES table
DROP POLICY IF EXISTS "Allow public read access to job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage job_categories" ON public.job_categories;

CREATE POLICY "Authenticated users can view job_categories" 
ON public.job_categories FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admin can manage job_categories" 
ON public.job_categories FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 8. TRAINEE_REVIEWS table
DROP POLICY IF EXISTS "Allow public read access to trainee_reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to manage trainee_reviews" ON public.trainee_reviews;

CREATE POLICY "Authenticated users can view trainee_reviews" 
ON public.trainee_reviews FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage trainee_reviews" 
ON public.trainee_reviews FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'teacher')
);

-- 9. INTERVIEW_HISTORY table
DROP POLICY IF EXISTS "Allow public read access to interview_history" ON public.interview_history;
DROP POLICY IF EXISTS "Allow authenticated users to manage interview_history" ON public.interview_history;

CREATE POLICY "Authenticated users can view interview_history" 
ON public.interview_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage interview_history" 
ON public.interview_history FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff')
);

-- 10. ENROLLMENT_HISTORY table
DROP POLICY IF EXISTS "Allow public read access to enrollment_history" ON public.enrollment_history;
DROP POLICY IF EXISTS "Allow authenticated users to manage enrollment_history" ON public.enrollment_history;

CREATE POLICY "Authenticated users can view enrollment_history" 
ON public.enrollment_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff and above can manage enrollment_history" 
ON public.enrollment_history FOR ALL 
TO authenticated 
USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'teacher')
);

-- 11. CLASS_TEACHERS table
DROP POLICY IF EXISTS "Allow public read access to class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Allow authenticated users to manage class_teachers" ON public.class_teachers;

CREATE POLICY "Authenticated users can view class_teachers" 
ON public.class_teachers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admin can manage class_teachers" 
ON public.class_teachers FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 12. Create rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    success BOOLEAN DEFAULT false,
    ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts" 
ON public.login_attempts FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Anyone can insert (for rate limiting check)
CREATE POLICY "Anyone can insert login attempts" 
ON public.login_attempts FOR INSERT 
WITH CHECK (true);

-- Function to check and record login attempts
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(_identifier TEXT, _ip_address TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    attempt_count INTEGER;
    last_attempt TIMESTAMP WITH TIME ZONE;
    max_attempts INTEGER := 5;
    lockout_minutes INTEGER := 15;
    result JSONB;
BEGIN
    -- Count recent failed attempts
    SELECT COUNT(*), MAX(attempt_time)
    INTO attempt_count, last_attempt
    FROM public.login_attempts
    WHERE identifier = _identifier
    AND success = false
    AND attempt_time > now() - (lockout_minutes || ' minutes')::INTERVAL;
    
    -- Check if locked out
    IF attempt_count >= max_attempts THEN
        result := jsonb_build_object(
            'allowed', false,
            'message', 'Tài khoản bị tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ' || lockout_minutes || ' phút.',
            'remaining_lockout_seconds', EXTRACT(EPOCH FROM (last_attempt + (lockout_minutes || ' minutes')::INTERVAL - now()))::INTEGER
        );
    ELSE
        result := jsonb_build_object(
            'allowed', true,
            'attempts_remaining', max_attempts - attempt_count,
            'message', NULL
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(_identifier TEXT, _success BOOLEAN, _ip_address TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.login_attempts (identifier, success, ip_address)
    VALUES (_identifier, _success, _ip_address);
    
    -- Clean up old attempts (older than 24 hours)
    DELETE FROM public.login_attempts
    WHERE attempt_time < now() - INTERVAL '24 hours';
END;
$$;

-- Add audit trigger to more tables
DROP TRIGGER IF EXISTS audit_attendance_changes ON public.attendance;
CREATE TRIGGER audit_attendance_changes
AFTER INSERT OR UPDATE OR DELETE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_test_scores_changes ON public.test_scores;
CREATE TRIGGER audit_test_scores_changes
AFTER INSERT OR UPDATE OR DELETE ON public.test_scores
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();