-- CLEANUP PHASE 4: Xoá policies dư cuối cùng

-- HANDBOOK_ENTRIES (giữ 4 chuẩn: handbook_entries_select/insert/update/delete)
DROP POLICY IF EXISTS "Admins can manage handbook entries" ON public.handbook_entries;
DROP POLICY IF EXISTS "Everyone can view published handbook entries" ON public.handbook_entries;

-- KATAKANA_NAMES (giữ 4 chuẩn)
DROP POLICY IF EXISTS "Manager+ can delete katakana_names" ON public.katakana_names;
DROP POLICY IF EXISTS "Staff+ can insert katakana_names" ON public.katakana_names;
DROP POLICY IF EXISTS "Staff+ can update katakana_names" ON public.katakana_names;

-- POLICY_CATEGORIES (giữ 4 chuẩn)
DROP POLICY IF EXISTS "policy_categories_delete_policy" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_insert_policy" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_update_policy" ON public.policy_categories;

-- PROFILES (giữ 4 chuẩn)
DROP POLICY IF EXISTS "System creates profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile only" ON public.profiles;

-- REFERRAL_SOURCES (giữ 4 chuẩn)
DROP POLICY IF EXISTS "Manager+ can delete referral_sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Staff+ can insert referral_sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Staff+ can update referral_sources" ON public.referral_sources;

-- RELIGIONS (giữ 4 chuẩn)
DROP POLICY IF EXISTS "religions_delete_policy" ON public.religions;
DROP POLICY IF EXISTS "religions_insert_policy" ON public.religions;
DROP POLICY IF EXISTS "religions_update_policy" ON public.religions;

-- TEACHERS (giữ 4 chuẩn)
DROP POLICY IF EXISTS "Manager+ can delete teachers" ON public.teachers;
DROP POLICY IF EXISTS "Manager+ can view teachers" ON public.teachers;

-- VOCABULARY (giữ 4 chuẩn)
DROP POLICY IF EXISTS "Manager+ can delete vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Staff+ can insert vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Staff+ can update vocabulary" ON public.vocabulary;

-- USER_SESSIONS
DROP POLICY IF EXISTS "Admin can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;