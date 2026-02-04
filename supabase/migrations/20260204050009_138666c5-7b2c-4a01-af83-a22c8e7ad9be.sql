-- CLEANUP PHASE 2: Xoá thêm policies cũ còn sót (không tạo mới nếu đã có)

-- EDUCATION_HISTORY
DROP POLICY IF EXISTS "Staff+ can delete education history" ON public.education_history;
DROP POLICY IF EXISTS "Staff+ can insert education history" ON public.education_history;
DROP POLICY IF EXISTS "Staff+ can update education history" ON public.education_history;
DROP POLICY IF EXISTS "Staff+ can view education history" ON public.education_history;

-- FAMILY_MEMBERS
DROP POLICY IF EXISTS "Staff+ can delete family members" ON public.family_members;
DROP POLICY IF EXISTS "Staff+ can insert family members" ON public.family_members;
DROP POLICY IF EXISTS "Staff+ can update family members" ON public.family_members;
DROP POLICY IF EXISTS "Staff+ can view family members" ON public.family_members;
DROP POLICY IF EXISTS "Admin can delete family members" ON public.family_members;

-- JAPAN_RELATIVES
DROP POLICY IF EXISTS "Staff+ can delete japan relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff+ can insert japan relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff+ can update japan relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff+ can view japan relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Admin can delete japan relatives" ON public.japan_relatives;

-- INTERVIEW_HISTORY
DROP POLICY IF EXISTS "Staff+ can delete interview history" ON public.interview_history;
DROP POLICY IF EXISTS "Staff+ can insert interview history" ON public.interview_history;
DROP POLICY IF EXISTS "Staff+ can update interview history" ON public.interview_history;
DROP POLICY IF EXISTS "Staff+ can view interview history" ON public.interview_history;

-- WORK_HISTORY
DROP POLICY IF EXISTS "Staff+ can delete work history" ON public.work_history;
DROP POLICY IF EXISTS "Staff+ can insert work history" ON public.work_history;
DROP POLICY IF EXISTS "Staff+ can update work history" ON public.work_history;
DROP POLICY IF EXISTS "Staff+ can view work history" ON public.work_history;

-- TRAINEE_WORKFLOW
DROP POLICY IF EXISTS "Staff+ can insert trainee workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Staff+ can update trainee workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Staff+ can view trainee workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Admin can delete trainee workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_select_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_insert_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_update_policy" ON public.trainee_workflow;

-- TRAINEE_REVIEWS
DROP POLICY IF EXISTS "Staff+ can view trainee reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Staff+ can insert trainee reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Staff+ can update trainee reviews" ON public.trainee_reviews;
DROP POLICY IF EXISTS "Admin can delete trainee reviews" ON public.trainee_reviews;

-- TEACHERS
DROP POLICY IF EXISTS "Teachers can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Staff+ can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Manager+ can insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "Manager+ can update teachers" ON public.teachers;

-- HANDBOOK_ENTRIES
DROP POLICY IF EXISTS "Staff+ can view handbook entries" ON public.handbook_entries;
DROP POLICY IF EXISTS "Manager+ can insert handbook entries" ON public.handbook_entries;

-- KATAKANA_NAMES (giữ lại policies hiện có nếu đã chuẩn)
DROP POLICY IF EXISTS "Anyone can read katakana names" ON public.katakana_names;
DROP POLICY IF EXISTS "Staff can insert katakana names" ON public.katakana_names;
DROP POLICY IF EXISTS "Staff can update katakana names" ON public.katakana_names;
DROP POLICY IF EXISTS "Admin can delete katakana names" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_delete_policy" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_insert_policy" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_select_policy" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_update_policy" ON public.katakana_names;

-- VOCABULARY
DROP POLICY IF EXISTS "Anyone can read vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Staff can insert vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Staff can update vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Admin can delete vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_delete_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_insert_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_select_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_update_policy" ON public.vocabulary;

-- REFERRAL_SOURCES
DROP POLICY IF EXISTS "Anyone can read referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Staff can insert referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Staff can update referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Admin can delete referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_delete_policy" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_insert_policy" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_select_policy" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_update_policy" ON public.referral_sources;

-- POLICY_CATEGORIES
DROP POLICY IF EXISTS "Anyone can read policy categories" ON public.policy_categories;
DROP POLICY IF EXISTS "Staff can insert policy categories" ON public.policy_categories;
DROP POLICY IF EXISTS "Staff can update policy categories" ON public.policy_categories;
DROP POLICY IF EXISTS "Admin can delete policy categories" ON public.policy_categories;

-- RELIGIONS
DROP POLICY IF EXISTS "Anyone can read religions" ON public.religions;
DROP POLICY IF EXISTS "Staff can insert religions" ON public.religions;
DROP POLICY IF EXISTS "Staff can update religions" ON public.religions;
DROP POLICY IF EXISTS "Admin can delete religions" ON public.religions;

-- HOBBIES
DROP POLICY IF EXISTS "Anyone can read hobbies" ON public.hobbies;
DROP POLICY IF EXISTS "Staff can insert hobbies" ON public.hobbies;
DROP POLICY IF EXISTS "Staff can update hobbies" ON public.hobbies;
DROP POLICY IF EXISTS "Admin can delete hobbies" ON public.hobbies;

-- USER_ROLES
DROP POLICY IF EXISTS "Admin can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all user roles" ON public.user_roles;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;