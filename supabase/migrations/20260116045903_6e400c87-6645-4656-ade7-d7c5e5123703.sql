-- =====================================================
-- CLEANUP: Remove remaining permissive policies
-- =====================================================

-- EDUCATION_HISTORY - Remove old policies
DROP POLICY IF EXISTS "Enable update for authenticated users on education_history" ON public.education_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users on education_history" ON public.education_history;

-- ENROLLMENT_HISTORY - Remove old policies
DROP POLICY IF EXISTS "Enable update for authenticated users on enrollment_history" ON public.enrollment_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users on enrollment_history" ON public.enrollment_history;

-- FAMILY_MEMBERS - Remove old policies
DROP POLICY IF EXISTS "Enable update for authenticated users on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users on family_members" ON public.family_members;

-- JAPAN_RELATIVES - Remove old policies
DROP POLICY IF EXISTS "Enable update for authenticated users on japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Enable delete for authenticated users on japan_relatives" ON public.japan_relatives;

-- JOB_CATEGORIES - Remove old policies
DROP POLICY IF EXISTS "Enable update for authenticated users on job_categories" ON public.job_categories;

-- KATAKANA_NAMES - Remove old policies
DROP POLICY IF EXISTS "Allow all operations on katakana_names" ON public.katakana_names;

-- LOGIN_ATTEMPTS - Keep special case but remove duplicate
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;

-- PROFILES - Remove permissive view policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- REFERRAL_SOURCES - Remove old policies
DROP POLICY IF EXISTS "Allow all operations on referral_sources" ON public.referral_sources;

-- TEST_SCORES - Remove old policies
DROP POLICY IF EXISTS "Enable delete for authenticated users on test_scores" ON public.test_scores;

-- TRAINEE_REVIEWS - Remove old policies
DROP POLICY IF EXISTS "Enable delete for authenticated users on trainee_reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Enable update for authenticated users on trainee_reviews" ON public.trainee_reviews;

-- TRAINEES - Remove permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.trainees;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.trainees;
DROP POLICY IF EXISTS "allow_update_trainees_authenticated" ON public.trainees;
DROP POLICY IF EXISTS "Enable delete for authenticated users on trainees" ON public.trainees;

-- UNION_MEMBERS - Remove old policies
DROP POLICY IF EXISTS "Authenticated users can delete union members" ON public.union_members;
DROP POLICY IF EXISTS "Authenticated users can update union members" ON public.union_members;
DROP POLICY IF EXISTS "Authenticated users can insert union members" ON public.union_members;
DROP POLICY IF EXISTS "Authenticated users can view union members" ON public.union_members;

-- UNION_TRANSACTIONS - Remove old policies
DROP POLICY IF EXISTS "Authenticated users can insert union transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete union transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Authenticated users can update union transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Authenticated users can view union transactions" ON public.union_transactions;

-- VOCABULARY - Remove old policies
DROP POLICY IF EXISTS "Allow all operations on vocabulary" ON public.vocabulary;

-- WORK_HISTORY - Remove old policies
DROP POLICY IF EXISTS "Enable delete for authenticated users on work_history" ON public.work_history;
DROP POLICY IF EXISTS "Enable update for authenticated users on work_history" ON public.work_history;