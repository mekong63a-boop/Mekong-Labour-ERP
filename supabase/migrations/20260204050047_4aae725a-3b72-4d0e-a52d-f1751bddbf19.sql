-- CLEANUP PHASE 3: Xoá tất cả policies dư thừa (giữ lại 4 policies chuẩn *_select, *_insert, *_update, *_delete)

-- EDUCATION_HISTORY (giữ lại: education_history_select/insert/update/delete)
DROP POLICY IF EXISTS "education_history_delete_by_menu" ON public.education_history;
DROP POLICY IF EXISTS "education_history_insert_by_menu" ON public.education_history;
DROP POLICY IF EXISTS "education_history_select_by_menu" ON public.education_history;
DROP POLICY IF EXISTS "education_history_update_by_menu" ON public.education_history;

-- FAMILY_MEMBERS (giữ lại: family_members_select/insert/update/delete)
DROP POLICY IF EXISTS "Manager+ can insert family_members" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete_by_menu" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert_by_menu" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select_by_menu" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update_by_menu" ON public.family_members;

-- JAPAN_RELATIVES (giữ lại: japan_relatives_select/insert/update/delete)
DROP POLICY IF EXISTS "Manager+ can insert japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_delete_by_menu" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_insert_by_menu" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_select_by_menu" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_update_by_menu" ON public.japan_relatives;

-- INTERVIEW_HISTORY (giữ lại: interview_history_select/insert/update/delete)
DROP POLICY IF EXISTS "interview_history_delete_by_menu" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_insert_by_menu" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_select_by_menu" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_update_by_menu" ON public.interview_history;

-- WORK_HISTORY (giữ lại: work_history_select/insert/update/delete)
DROP POLICY IF EXISTS "work_history_delete_by_menu" ON public.work_history;
DROP POLICY IF EXISTS "work_history_insert_by_menu" ON public.work_history;
DROP POLICY IF EXISTS "work_history_select_by_menu" ON public.work_history;
DROP POLICY IF EXISTS "work_history_update_by_menu" ON public.work_history;

-- TRAINEE_WORKFLOW (giữ lại: trainee_workflow_select/insert/update - không có delete)
DROP POLICY IF EXISTS "Authorized can update workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Manager can insert workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Staff can view workflow" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_delete_by_menu" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_insert_by_menu" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_select_by_menu" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_update_by_menu" ON public.trainee_workflow;

-- TRAINEE_REVIEWS (giữ lại: trainee_reviews_select/insert/update/delete)
DROP POLICY IF EXISTS "trainee_reviews_delete_menu" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_insert_menu" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_select_menu" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_update_menu" ON public.trainee_reviews;

-- USER_ROLES (giữ lại policies chuẩn cho admin)
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- TEACHERS
DROP POLICY IF EXISTS "teachers_insert_by_menu" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_by_menu" ON public.teachers;

-- HANDBOOK_ENTRIES
DROP POLICY IF EXISTS "handbook_entries_insert_by_menu" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_select_by_menu" ON public.handbook_entries;

-- KATAKANA/VOCABULARY/REFERRAL/POLICY_CATEGORIES/RELIGIONS (giữ lại policies chuẩn)
DROP POLICY IF EXISTS "katakana_names_delete_by_menu" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_names_insert_by_menu" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_names_update_by_menu" ON public.katakana_names;
DROP POLICY IF EXISTS "vocabulary_delete_by_menu" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_insert_by_menu" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_update_by_menu" ON public.vocabulary;
DROP POLICY IF EXISTS "referral_sources_delete_by_menu" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_insert_by_menu" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_update_by_menu" ON public.referral_sources;
DROP POLICY IF EXISTS "policy_categories_delete_by_menu" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_insert_by_menu" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_update_by_menu" ON public.policy_categories;
DROP POLICY IF EXISTS "religions_delete_by_menu" ON public.religions;
DROP POLICY IF EXISTS "religions_insert_by_menu" ON public.religions;
DROP POLICY IF EXISTS "religions_update_by_menu" ON public.religions;

-- PROFILES (chuẩn hoá admin policies)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;