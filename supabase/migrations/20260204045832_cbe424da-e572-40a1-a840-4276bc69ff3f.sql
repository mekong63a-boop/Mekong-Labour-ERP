-- =====================================================
-- CHUẨN HOÁ RLS: 1 TABLE = 1 SET POLICY (can_*)
-- Admin override được gói trong hàm can_*
-- =====================================================

-- 0. XOÁ CÁC FUNCTION CŨ VỚI SIGNATURE KHÁC
DROP FUNCTION IF EXISTS public.can_delete(uuid);

-- 1. CẬP NHẬT HÀM can_* VỚI ADMIN OVERRIDE BUILT-IN
CREATE OR REPLACE FUNCTION public.can_view(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), _menu_key, 'view')
$$;

CREATE OR REPLACE FUNCTION public.can_insert(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), _menu_key, 'create')
$$;

CREATE OR REPLACE FUNCTION public.can_update(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), _menu_key, 'update')
$$;

CREATE OR REPLACE FUNCTION public.can_delete(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), _menu_key, 'delete')
$$;

-- 2. XOÁ TẤT CẢ POLICIES CŨ TRÙNG LẶP

-- TRAINEES
DROP POLICY IF EXISTS "Authenticated users can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "trainees_select" ON public.trainees;
DROP POLICY IF EXISTS "trainees_insert" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete" ON public.trainees;
DROP POLICY IF EXISTS "trainees_insert_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete_policy" ON public.trainees;

-- COMPANIES
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- UNIONS
DROP POLICY IF EXISTS "unions_select" ON public.unions;
DROP POLICY IF EXISTS "unions_insert" ON public.unions;
DROP POLICY IF EXISTS "unions_update" ON public.unions;
DROP POLICY IF EXISTS "unions_delete" ON public.unions;
DROP POLICY IF EXISTS "unions_select_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_insert_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_update_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_delete_policy" ON public.unions;

-- JOB_CATEGORIES
DROP POLICY IF EXISTS "job_categories_select" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_insert" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_select_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_insert_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete_policy" ON public.job_categories;

-- ORDERS
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

-- CLASSES
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_update_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON public.classes;

-- TEACHERS
DROP POLICY IF EXISTS "teachers_select" ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update" ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete" ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON public.teachers;

-- ATTENDANCE
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete_policy" ON public.attendance;

-- TEST_SCORES
DROP POLICY IF EXISTS "test_scores_select" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_insert" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_update" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_delete" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_insert_policy" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_update_policy" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_delete_policy" ON public.test_scores;

-- DORMITORIES
DROP POLICY IF EXISTS "dormitories_select" ON public.dormitories;
DROP POLICY IF EXISTS "dormitories_insert" ON public.dormitories;
DROP POLICY IF EXISTS "dormitories_update" ON public.dormitories;
DROP POLICY IF EXISTS "dormitories_delete" ON public.dormitories;

-- DORMITORY_RESIDENTS
DROP POLICY IF EXISTS "dormitory_residents_select" ON public.dormitory_residents;
DROP POLICY IF EXISTS "dormitory_residents_insert" ON public.dormitory_residents;
DROP POLICY IF EXISTS "dormitory_residents_update" ON public.dormitory_residents;
DROP POLICY IF EXISTS "dormitory_residents_delete" ON public.dormitory_residents;

-- TRAINEE_REVIEWS
DROP POLICY IF EXISTS "trainee_reviews_select" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_insert" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_update" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_delete" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_select_policy" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_insert_policy" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_update_policy" ON public.trainee_reviews;
DROP POLICY IF EXISTS "trainee_reviews_delete_policy" ON public.trainee_reviews;

-- TRAINEE_WORKFLOW
DROP POLICY IF EXISTS "trainee_workflow_select" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_insert" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_update" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_delete" ON public.trainee_workflow;

-- TRAINEE_WORKFLOW_HISTORY
DROP POLICY IF EXISTS "trainee_workflow_history_select" ON public.trainee_workflow_history;
DROP POLICY IF EXISTS "trainee_workflow_history_insert" ON public.trainee_workflow_history;

-- CHILD TABLES OF TRAINEES
DROP POLICY IF EXISTS "education_history_select" ON public.education_history;
DROP POLICY IF EXISTS "education_history_insert" ON public.education_history;
DROP POLICY IF EXISTS "education_history_update" ON public.education_history;
DROP POLICY IF EXISTS "education_history_delete" ON public.education_history;

DROP POLICY IF EXISTS "work_history_select" ON public.work_history;
DROP POLICY IF EXISTS "work_history_insert" ON public.work_history;
DROP POLICY IF EXISTS "work_history_update" ON public.work_history;
DROP POLICY IF EXISTS "work_history_delete" ON public.work_history;

DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;

DROP POLICY IF EXISTS "japan_relatives_select" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_insert" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_update" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_delete" ON public.japan_relatives;

DROP POLICY IF EXISTS "interview_history_select" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_insert" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_update" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_delete" ON public.interview_history;

-- HANDBOOK
DROP POLICY IF EXISTS "handbook_entries_select" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_insert" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_update" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_delete" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_select_policy" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_insert_policy" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_update_policy" ON public.handbook_entries;
DROP POLICY IF EXISTS "handbook_entries_delete_policy" ON public.handbook_entries;

-- CLASS_TEACHERS
DROP POLICY IF EXISTS "class_teachers_select" ON public.class_teachers;
DROP POLICY IF EXISTS "class_teachers_insert" ON public.class_teachers;
DROP POLICY IF EXISTS "class_teachers_update" ON public.class_teachers;
DROP POLICY IF EXISTS "class_teachers_delete" ON public.class_teachers;

-- ENROLLMENT_HISTORY
DROP POLICY IF EXISTS "enrollment_history_select" ON public.enrollment_history;
DROP POLICY IF EXISTS "enrollment_history_insert" ON public.enrollment_history;
DROP POLICY IF EXISTS "enrollment_history_update" ON public.enrollment_history;
DROP POLICY IF EXISTS "enrollment_history_delete" ON public.enrollment_history;

-- 3. TẠO POLICIES MỚI CHUẨN HOÁ (1 policy/cmd/table)

-- TRAINEES (menu_key = 'trainees')
CREATE POLICY "trainees_select" ON public.trainees FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "trainees_insert" ON public.trainees FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "trainees_update" ON public.trainees FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "trainees_delete" ON public.trainees FOR DELETE TO authenticated USING (can_delete('trainees'));

-- COMPANIES (menu_key = 'partners')
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated USING (can_view('partners'));
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (can_insert('partners'));
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated USING (can_update('partners')) WITH CHECK (can_update('partners'));
CREATE POLICY "companies_delete" ON public.companies FOR DELETE TO authenticated USING (can_delete('partners'));

-- UNIONS (menu_key = 'partners')
CREATE POLICY "unions_select" ON public.unions FOR SELECT TO authenticated USING (can_view('partners'));
CREATE POLICY "unions_insert" ON public.unions FOR INSERT TO authenticated WITH CHECK (can_insert('partners'));
CREATE POLICY "unions_update" ON public.unions FOR UPDATE TO authenticated USING (can_update('partners')) WITH CHECK (can_update('partners'));
CREATE POLICY "unions_delete" ON public.unions FOR DELETE TO authenticated USING (can_delete('partners'));

-- JOB_CATEGORIES (menu_key = 'partners')
CREATE POLICY "job_categories_select" ON public.job_categories FOR SELECT TO authenticated USING (can_view('partners'));
CREATE POLICY "job_categories_insert" ON public.job_categories FOR INSERT TO authenticated WITH CHECK (can_insert('partners'));
CREATE POLICY "job_categories_update" ON public.job_categories FOR UPDATE TO authenticated USING (can_update('partners')) WITH CHECK (can_update('partners'));
CREATE POLICY "job_categories_delete" ON public.job_categories FOR DELETE TO authenticated USING (can_delete('partners'));

-- ORDERS (menu_key = 'orders')
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (can_view('orders'));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (can_insert('orders'));
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated USING (can_update('orders')) WITH CHECK (can_update('orders'));
CREATE POLICY "orders_delete" ON public.orders FOR DELETE TO authenticated USING (can_delete('orders'));

-- CLASSES (menu_key = 'education')
CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "classes_insert" ON public.classes FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "classes_update" ON public.classes FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "classes_delete" ON public.classes FOR DELETE TO authenticated USING (can_delete('education'));

-- TEACHERS (menu_key = 'education')
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "teachers_insert" ON public.teachers FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "teachers_update" ON public.teachers FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "teachers_delete" ON public.teachers FOR DELETE TO authenticated USING (can_delete('education'));

-- ATTENDANCE (menu_key = 'education')
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE TO authenticated USING (can_delete('education'));

-- TEST_SCORES (menu_key = 'education')
CREATE POLICY "test_scores_select" ON public.test_scores FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "test_scores_insert" ON public.test_scores FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "test_scores_update" ON public.test_scores FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "test_scores_delete" ON public.test_scores FOR DELETE TO authenticated USING (can_delete('education'));

-- CLASS_TEACHERS (menu_key = 'education')
CREATE POLICY "class_teachers_select" ON public.class_teachers FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "class_teachers_insert" ON public.class_teachers FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "class_teachers_update" ON public.class_teachers FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "class_teachers_delete" ON public.class_teachers FOR DELETE TO authenticated USING (can_delete('education'));

-- ENROLLMENT_HISTORY (menu_key = 'education')
CREATE POLICY "enrollment_history_select" ON public.enrollment_history FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "enrollment_history_insert" ON public.enrollment_history FOR INSERT TO authenticated WITH CHECK (can_insert('education'));

-- DORMITORIES (menu_key = 'dormitory')
CREATE POLICY "dormitories_select" ON public.dormitories FOR SELECT TO authenticated USING (can_view('dormitory'));
CREATE POLICY "dormitories_insert" ON public.dormitories FOR INSERT TO authenticated WITH CHECK (can_insert('dormitory'));
CREATE POLICY "dormitories_update" ON public.dormitories FOR UPDATE TO authenticated USING (can_update('dormitory')) WITH CHECK (can_update('dormitory'));
CREATE POLICY "dormitories_delete" ON public.dormitories FOR DELETE TO authenticated USING (can_delete('dormitory'));

-- DORMITORY_RESIDENTS (menu_key = 'dormitory')
CREATE POLICY "dormitory_residents_select" ON public.dormitory_residents FOR SELECT TO authenticated USING (can_view('dormitory'));
CREATE POLICY "dormitory_residents_insert" ON public.dormitory_residents FOR INSERT TO authenticated WITH CHECK (can_insert('dormitory'));
CREATE POLICY "dormitory_residents_update" ON public.dormitory_residents FOR UPDATE TO authenticated USING (can_update('dormitory')) WITH CHECK (can_update('dormitory'));
CREATE POLICY "dormitory_residents_delete" ON public.dormitory_residents FOR DELETE TO authenticated USING (can_delete('dormitory'));

-- TRAINEE_REVIEWS (menu_key = 'education')
CREATE POLICY "trainee_reviews_select" ON public.trainee_reviews FOR SELECT TO authenticated USING (can_view('education'));
CREATE POLICY "trainee_reviews_insert" ON public.trainee_reviews FOR INSERT TO authenticated WITH CHECK (can_insert('education'));
CREATE POLICY "trainee_reviews_update" ON public.trainee_reviews FOR UPDATE TO authenticated USING (can_update('education')) WITH CHECK (can_update('education'));
CREATE POLICY "trainee_reviews_delete" ON public.trainee_reviews FOR DELETE TO authenticated USING (can_delete('education'));

-- TRAINEE_WORKFLOW (menu_key = 'trainees')
CREATE POLICY "trainee_workflow_select" ON public.trainee_workflow FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "trainee_workflow_insert" ON public.trainee_workflow FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "trainee_workflow_update" ON public.trainee_workflow FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));

-- TRAINEE_WORKFLOW_HISTORY (menu_key = 'trainees') - chỉ view và insert
CREATE POLICY "trainee_workflow_history_select" ON public.trainee_workflow_history FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "trainee_workflow_history_insert" ON public.trainee_workflow_history FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));

-- EDUCATION_HISTORY (child of trainees)
CREATE POLICY "education_history_select" ON public.education_history FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "education_history_insert" ON public.education_history FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "education_history_update" ON public.education_history FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "education_history_delete" ON public.education_history FOR DELETE TO authenticated USING (can_delete('trainees'));

-- WORK_HISTORY (child of trainees)
CREATE POLICY "work_history_select" ON public.work_history FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "work_history_insert" ON public.work_history FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "work_history_update" ON public.work_history FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "work_history_delete" ON public.work_history FOR DELETE TO authenticated USING (can_delete('trainees'));

-- FAMILY_MEMBERS (child of trainees)
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE TO authenticated USING (can_delete('trainees'));

-- JAPAN_RELATIVES (child of trainees)
CREATE POLICY "japan_relatives_select" ON public.japan_relatives FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "japan_relatives_insert" ON public.japan_relatives FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "japan_relatives_update" ON public.japan_relatives FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "japan_relatives_delete" ON public.japan_relatives FOR DELETE TO authenticated USING (can_delete('trainees'));

-- INTERVIEW_HISTORY (child of trainees)
CREATE POLICY "interview_history_select" ON public.interview_history FOR SELECT TO authenticated USING (can_view('trainees'));
CREATE POLICY "interview_history_insert" ON public.interview_history FOR INSERT TO authenticated WITH CHECK (can_insert('trainees'));
CREATE POLICY "interview_history_update" ON public.interview_history FOR UPDATE TO authenticated USING (can_update('trainees')) WITH CHECK (can_update('trainees'));
CREATE POLICY "interview_history_delete" ON public.interview_history FOR DELETE TO authenticated USING (can_delete('trainees'));

-- HANDBOOK_ENTRIES (menu_key = 'handbook')
CREATE POLICY "handbook_entries_select" ON public.handbook_entries FOR SELECT TO authenticated USING (can_view('handbook'));
CREATE POLICY "handbook_entries_insert" ON public.handbook_entries FOR INSERT TO authenticated WITH CHECK (can_insert('handbook'));
CREATE POLICY "handbook_entries_update" ON public.handbook_entries FOR UPDATE TO authenticated USING (can_update('handbook')) WITH CHECK (can_update('handbook'));
CREATE POLICY "handbook_entries_delete" ON public.handbook_entries FOR DELETE TO authenticated USING (can_delete('handbook'));

-- 4. COMMENT DOCUMENTATION
COMMENT ON FUNCTION public.can_view(text) IS 'Check view permission with admin override built-in';
COMMENT ON FUNCTION public.can_insert(text) IS 'Check insert permission with admin override built-in';
COMMENT ON FUNCTION public.can_update(text) IS 'Check update permission with admin override built-in';
COMMENT ON FUNCTION public.can_delete(text) IS 'Check delete permission with admin override built-in';