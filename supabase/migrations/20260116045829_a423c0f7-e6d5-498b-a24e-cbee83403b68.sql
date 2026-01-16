-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- This migration removes ALL permissive policies and
-- implements strict role-based access control
-- =====================================================

-- =====================================================
-- STEP 1: Create additional security helper functions
-- =====================================================

-- Function to check if user is authenticated (not anon)
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Function to check if user is staff or higher
CREATE OR REPLACE FUNCTION public.is_staff_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'staff')
  )
$$;

-- Function to check if user is teacher or higher
CREATE OR REPLACE FUNCTION public.is_teacher_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'teacher')
  )
$$;

-- Function to check if user is manager or higher
CREATE OR REPLACE FUNCTION public.is_manager_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Function to check if user has any role assigned
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- =====================================================
-- STEP 2: Drop ALL existing policies on all tables
-- =====================================================

-- ATTENDANCE
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable read access for all users on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for authenticated users on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Only admin can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admin can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admin can update attendance" ON public.attendance;

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

-- CLASS_TEACHERS
DROP POLICY IF EXISTS "Admin can manage class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Authenticated users can view class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Enable delete for authenticated users on class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Enable insert for authenticated users on class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "Enable read access for all users on class_teachers" ON public.class_teachers;

-- CLASSES
DROP POLICY IF EXISTS "Enable delete for authenticated users on classes" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users on classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for all users on classes" ON public.classes;
DROP POLICY IF EXISTS "Enable update for authenticated users on classes" ON public.classes;

-- COMPANIES
DROP POLICY IF EXISTS "Enable insert for authenticated users on companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users on companies" ON public.companies;
DROP POLICY IF EXISTS "Enable update for authenticated users on companies" ON public.companies;

-- EDIT_PERMISSIONS
DROP POLICY IF EXISTS "Managers and admins can update edit permissions" ON public.edit_permissions;
DROP POLICY IF EXISTS "Users can request edit permissions" ON public.edit_permissions;
DROP POLICY IF EXISTS "Users can view their own edit permissions" ON public.edit_permissions;

-- EDUCATION_HISTORY
DROP POLICY IF EXISTS "Authenticated users can view education_history" ON public.education_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users on education_history" ON public.education_history;
DROP POLICY IF EXISTS "Enable read access for all users on education_history" ON public.education_history;
DROP POLICY IF EXISTS "Staff and admin can manage education_history" ON public.education_history;

-- ENROLLMENT_HISTORY
DROP POLICY IF EXISTS "Authenticated users can view enrollment_history" ON public.enrollment_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users on enrollment_history" ON public.enrollment_history;
DROP POLICY IF EXISTS "Enable read access for all users on enrollment_history" ON public.enrollment_history;
DROP POLICY IF EXISTS "Staff and admin can manage enrollment_history" ON public.enrollment_history;

-- FAMILY_MEMBERS
DROP POLICY IF EXISTS "Authenticated users can view family_members" ON public.family_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Enable read access for all users on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Staff and admin can manage family_members" ON public.family_members;

-- INTERVIEW_HISTORY
DROP POLICY IF EXISTS "Authenticated users can view interview_history" ON public.interview_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users on interview_history" ON public.interview_history;
DROP POLICY IF EXISTS "Enable read access for all users on interview_history" ON public.interview_history;
DROP POLICY IF EXISTS "Staff and admin can manage interview_history" ON public.interview_history;

-- JAPAN_RELATIVES
DROP POLICY IF EXISTS "Authenticated users can view japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Enable insert for authenticated users on japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Enable read access for all users on japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff and admin can manage japan_relatives" ON public.japan_relatives;

-- JOB_CATEGORIES
DROP POLICY IF EXISTS "Admin can manage job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Authenticated users can view job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users on job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Enable read access for all users on job_categories" ON public.job_categories;

-- KATAKANA_NAMES
DROP POLICY IF EXISTS "Enable insert for authenticated users only on katakana" ON public.katakana_names;
DROP POLICY IF EXISTS "Enable read access for all users on katakana" ON public.katakana_names;
DROP POLICY IF EXISTS "Enable update for authenticated users on katakana" ON public.katakana_names;

-- LOGIN_ATTEMPTS (system table - special handling)
DROP POLICY IF EXISTS "Enable insert for all users on login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Enable read access for all users on login_attempts" ON public.login_attempts;

-- ORDERS
DROP POLICY IF EXISTS "Enable insert for authenticated users on orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users on orders" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users on orders" ON public.orders;

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users on profiles" ON public.profiles;

-- REFERRAL_SOURCES
DROP POLICY IF EXISTS "Enable insert for authenticated users only on referral" ON public.referral_sources;
DROP POLICY IF EXISTS "Enable read access for all users on referral" ON public.referral_sources;
DROP POLICY IF EXISTS "Enable update for authenticated users on referral" ON public.referral_sources;

-- TEACHERS
DROP POLICY IF EXISTS "Enable insert for authenticated users on teachers" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users on teachers" ON public.teachers;
DROP POLICY IF EXISTS "Enable update for authenticated users on teachers" ON public.teachers;

-- TEST_SCORES
DROP POLICY IF EXISTS "Authenticated users can view test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Enable insert for authenticated users on test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Enable read access for all users on test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Enable update for authenticated users on test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Only admin can delete test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Teachers and admin can insert test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "Teachers and admin can update test_scores" ON public.test_scores;

-- TRAINEE_REVIEWS
DROP POLICY IF EXISTS "Authenticated users can view trainee_reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users on trainee_reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Enable read access for all users on trainee_reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Staff and admin can manage trainee_reviews" ON public.trainee_reviews;

-- TRAINEES
DROP POLICY IF EXISTS "Enable insert for authenticated users on trainees" ON public.trainees;
DROP POLICY IF EXISTS "Enable read access for all users on trainees" ON public.trainees;
DROP POLICY IF EXISTS "Enable update for authenticated users on trainees" ON public.trainees;

-- UNION_MEMBERS
DROP POLICY IF EXISTS "Enable insert for authenticated users on union_members" ON public.union_members;
DROP POLICY IF EXISTS "Enable read access for all users on union_members" ON public.union_members;
DROP POLICY IF EXISTS "Enable update for authenticated users on union_members" ON public.union_members;

-- UNION_TRANSACTIONS
DROP POLICY IF EXISTS "Enable insert for authenticated users on union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Enable read access for all users on union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users on union_transactions" ON public.union_transactions;

-- UNIONS
DROP POLICY IF EXISTS "Enable insert for authenticated users on unions" ON public.unions;
DROP POLICY IF EXISTS "Enable read access for all users on unions" ON public.unions;
DROP POLICY IF EXISTS "Enable update for authenticated users on unions" ON public.unions;

-- USER_ROLES
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow first admin setup" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- USER_SESSIONS
DROP POLICY IF EXISTS "Enable insert for authenticated users on user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Enable read access for all users on user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users on user_sessions" ON public.user_sessions;

-- VOCABULARY
DROP POLICY IF EXISTS "Enable insert for authenticated users only on vocab" ON public.vocabulary;
DROP POLICY IF EXISTS "Enable read access for all users on vocab" ON public.vocabulary;
DROP POLICY IF EXISTS "Enable update for authenticated users on vocab" ON public.vocabulary;

-- WORK_HISTORY
DROP POLICY IF EXISTS "Authenticated users can view work_history" ON public.work_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users on work_history" ON public.work_history;
DROP POLICY IF EXISTS "Enable read access for all users on work_history" ON public.work_history;
DROP POLICY IF EXISTS "Staff and admin can manage work_history" ON public.work_history;

-- =====================================================
-- STEP 3: Create strict RLS policies for ALL tables
-- All policies require authentication and role verification
-- =====================================================

-- =====================================================
-- ATTENDANCE - Teacher+ can read/write
-- =====================================================
CREATE POLICY "attendance_select" ON public.attendance
FOR SELECT TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "attendance_insert" ON public.attendance
FOR INSERT TO authenticated
WITH CHECK (public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "attendance_update" ON public.attendance
FOR UPDATE TO authenticated
USING (public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "attendance_delete" ON public.attendance
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- AUDIT_LOGS - Admin only read, system insert
-- =====================================================
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

-- =====================================================
-- CLASS_TEACHERS - Manager+ can manage, Teacher+ can read
-- =====================================================
CREATE POLICY "class_teachers_select" ON public.class_teachers
FOR SELECT TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "class_teachers_insert" ON public.class_teachers
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "class_teachers_update" ON public.class_teachers
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "class_teachers_delete" ON public.class_teachers
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- CLASSES - All roles can read, Manager+ can write
-- =====================================================
CREATE POLICY "classes_select" ON public.classes
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "classes_insert" ON public.classes
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "classes_update" ON public.classes
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "classes_delete" ON public.classes
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- COMPANIES - Manager+ can read/write
-- =====================================================
CREATE POLICY "companies_select" ON public.companies
FOR SELECT TO authenticated
USING (public.is_manager_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "companies_insert" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "companies_update" ON public.companies
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "companies_delete" ON public.companies
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- EDIT_PERMISSIONS - Own request or Manager+ can manage
-- =====================================================
CREATE POLICY "edit_permissions_select" ON public.edit_permissions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_manager_or_higher(auth.uid()));

CREATE POLICY "edit_permissions_insert" ON public.edit_permissions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

CREATE POLICY "edit_permissions_update" ON public.edit_permissions
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "edit_permissions_delete" ON public.edit_permissions
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- EDUCATION_HISTORY - Staff+ can read/write (personal data)
-- =====================================================
CREATE POLICY "education_history_select" ON public.education_history
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "education_history_insert" ON public.education_history
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "education_history_update" ON public.education_history
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "education_history_delete" ON public.education_history
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

-- =====================================================
-- ENROLLMENT_HISTORY - Teacher+ can read, Staff+ can write
-- =====================================================
CREATE POLICY "enrollment_history_select" ON public.enrollment_history
FOR SELECT TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "enrollment_history_insert" ON public.enrollment_history
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()) OR public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "enrollment_history_update" ON public.enrollment_history
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "enrollment_history_delete" ON public.enrollment_history
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- FAMILY_MEMBERS - Staff+ only (sensitive personal data)
-- =====================================================
CREATE POLICY "family_members_select" ON public.family_members
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "family_members_insert" ON public.family_members
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "family_members_update" ON public.family_members
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "family_members_delete" ON public.family_members
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

-- =====================================================
-- INTERVIEW_HISTORY - Staff+ can read/write
-- =====================================================
CREATE POLICY "interview_history_select" ON public.interview_history
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "interview_history_insert" ON public.interview_history
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "interview_history_update" ON public.interview_history
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "interview_history_delete" ON public.interview_history
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

-- =====================================================
-- JAPAN_RELATIVES - Staff+ only (sensitive personal data)
-- =====================================================
CREATE POLICY "japan_relatives_select" ON public.japan_relatives
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "japan_relatives_insert" ON public.japan_relatives
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "japan_relatives_update" ON public.japan_relatives
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "japan_relatives_delete" ON public.japan_relatives
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

-- =====================================================
-- JOB_CATEGORIES - All roles can read, Manager+ can write
-- =====================================================
CREATE POLICY "job_categories_select" ON public.job_categories
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "job_categories_insert" ON public.job_categories
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "job_categories_update" ON public.job_categories
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "job_categories_delete" ON public.job_categories
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- KATAKANA_NAMES - All roles can read, Staff+ can write
-- =====================================================
CREATE POLICY "katakana_names_select" ON public.katakana_names
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "katakana_names_insert" ON public.katakana_names
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "katakana_names_update" ON public.katakana_names
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "katakana_names_delete" ON public.katakana_names
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- LOGIN_ATTEMPTS - System table, RPC access only
-- =====================================================
CREATE POLICY "login_attempts_insert" ON public.login_attempts
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "login_attempts_select" ON public.login_attempts
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- ORDERS - Manager+ can read/write
-- =====================================================
CREATE POLICY "orders_select" ON public.orders
FOR SELECT TO authenticated
USING (public.is_manager_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "orders_insert" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "orders_update" ON public.orders
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "orders_delete" ON public.orders
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- PROFILES - Own profile or Admin can view all
-- =====================================================
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- =====================================================
-- REFERRAL_SOURCES - All roles can read, Staff+ can write
-- =====================================================
CREATE POLICY "referral_sources_select" ON public.referral_sources
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "referral_sources_insert" ON public.referral_sources
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "referral_sources_update" ON public.referral_sources
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "referral_sources_delete" ON public.referral_sources
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- TEACHERS - Manager+ can manage, All roles can read
-- =====================================================
CREATE POLICY "teachers_select" ON public.teachers
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "teachers_insert" ON public.teachers
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "teachers_update" ON public.teachers
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "teachers_delete" ON public.teachers
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- TEST_SCORES - Teacher+ can read/write
-- =====================================================
CREATE POLICY "test_scores_select" ON public.test_scores
FOR SELECT TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "test_scores_insert" ON public.test_scores
FOR INSERT TO authenticated
WITH CHECK (public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "test_scores_update" ON public.test_scores
FOR UPDATE TO authenticated
USING (public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "test_scores_delete" ON public.test_scores
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- TRAINEE_REVIEWS - Teacher+ can read/write
-- =====================================================
CREATE POLICY "trainee_reviews_select" ON public.trainee_reviews
FOR SELECT TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "trainee_reviews_insert" ON public.trainee_reviews
FOR INSERT TO authenticated
WITH CHECK (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "trainee_reviews_update" ON public.trainee_reviews
FOR UPDATE TO authenticated
USING (public.is_teacher_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "trainee_reviews_delete" ON public.trainee_reviews
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

-- =====================================================
-- TRAINEES - Staff+ can read/write (core personal data)
-- =====================================================
CREATE POLICY "trainees_select" ON public.trainees
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()) OR public.is_teacher_or_higher(auth.uid()));

CREATE POLICY "trainees_insert" ON public.trainees
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "trainees_update" ON public.trainees
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "trainees_delete" ON public.trainees
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- UNION_MEMBERS - Manager+ only
-- =====================================================
CREATE POLICY "union_members_select" ON public.union_members
FOR SELECT TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_members_insert" ON public.union_members
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_members_update" ON public.union_members
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_members_delete" ON public.union_members
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- UNION_TRANSACTIONS - Manager+ only
-- =====================================================
CREATE POLICY "union_transactions_select" ON public.union_transactions
FOR SELECT TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_transactions_insert" ON public.union_transactions
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_transactions_update" ON public.union_transactions
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "union_transactions_delete" ON public.union_transactions
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- UNIONS - Manager+ can read/write
-- =====================================================
CREATE POLICY "unions_select" ON public.unions
FOR SELECT TO authenticated
USING (public.is_manager_or_higher(auth.uid()) OR public.is_staff_or_higher(auth.uid()));

CREATE POLICY "unions_insert" ON public.unions
FOR INSERT TO authenticated
WITH CHECK (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "unions_update" ON public.unions
FOR UPDATE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));

CREATE POLICY "unions_delete" ON public.unions
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- USER_ROLES - Critical: Admin only, users can view own
-- =====================================================
CREATE POLICY "user_roles_select_own" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_roles_insert" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'))
);

CREATE POLICY "user_roles_update" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_delete" ON public.user_roles
FOR DELETE TO authenticated
USING (public.is_primary_admin(auth.uid()));

-- =====================================================
-- USER_SESSIONS - Own session or Admin
-- =====================================================
CREATE POLICY "user_sessions_select" ON public.user_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_sessions_insert" ON public.user_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update" ON public.user_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_sessions_delete" ON public.user_sessions
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- VOCABULARY - All roles can read, Staff+ can write
-- =====================================================
CREATE POLICY "vocabulary_select" ON public.vocabulary
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "vocabulary_insert" ON public.vocabulary
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "vocabulary_update" ON public.vocabulary
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "vocabulary_delete" ON public.vocabulary
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- WORK_HISTORY - Staff+ only (sensitive personal data)
-- =====================================================
CREATE POLICY "work_history_select" ON public.work_history
FOR SELECT TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "work_history_insert" ON public.work_history
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "work_history_update" ON public.work_history
FOR UPDATE TO authenticated
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "work_history_delete" ON public.work_history
FOR DELETE TO authenticated
USING (public.is_manager_or_higher(auth.uid()));