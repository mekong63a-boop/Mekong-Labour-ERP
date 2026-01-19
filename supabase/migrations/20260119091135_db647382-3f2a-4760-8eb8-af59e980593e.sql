-- =====================================================
-- SINGLE SOURCE OF TRUTH: Hợp nhất nguồn dữ liệu trainees
-- Tất cả tài khoản đọc từ CÙNG MỘT NGUỒN
-- =====================================================

-- 1. XÓA VIEW trainees_masked (nếu tồn tại)
DROP VIEW IF EXISTS public.trainees_masked CASCADE;

-- 2. CẬP NHẬT VIEW trainees_basic - đọc trực tiếp từ trainees
DROP VIEW IF EXISTS public.trainees_basic CASCADE;
CREATE VIEW public.trainees_basic 
WITH (security_invoker=on) AS
SELECT * FROM public.trainees;

-- 3. CẬP NHẬT VIEW trainees_with_workflow - đọc trực tiếp từ trainees
DROP VIEW IF EXISTS public.trainees_with_workflow CASCADE;
CREATE VIEW public.trainees_with_workflow 
WITH (security_invoker=on) AS
SELECT 
  t.*,
  tw.current_stage,
  tw.sub_status,
  tw.owner_department_id,
  tw.transitioned_at,
  tw.transitioned_by
FROM public.trainees t
LEFT JOIN public.trainee_workflow tw ON t.id = tw.trainee_id;

-- =====================================================
-- 4. XÓA TẤT CẢ RLS POLICIES CŨ TRÊN BẢNG trainees
-- =====================================================
DROP POLICY IF EXISTS "trainees_select_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_insert_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete_policy" ON public.trainees;
DROP POLICY IF EXISTS "Admin full access to trainees" ON public.trainees;
DROP POLICY IF EXISTS "Manager can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "Staff can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "Authenticated users can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "Users can view trainees with menu permission" ON public.trainees;
DROP POLICY IF EXISTS "Users can insert trainees with menu permission" ON public.trainees;
DROP POLICY IF EXISTS "Users can update trainees with menu permission" ON public.trainees;
DROP POLICY IF EXISTS "Users can delete trainees with menu permission" ON public.trainees;

-- =====================================================
-- 5. TẠO RLS POLICIES MỚI - CHỈ DỰA TRÊN MENU PERMISSIONS
-- =====================================================

-- SELECT: Chỉ cần can_view('trainees')
CREATE POLICY "trainees_select_by_menu_permission"
ON public.trainees FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

-- INSERT: Chỉ cần can_insert('trainees')
CREATE POLICY "trainees_insert_by_menu_permission"
ON public.trainees FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

-- UPDATE: Chỉ cần can_update('trainees')
CREATE POLICY "trainees_update_by_menu_permission"
ON public.trainees FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

-- DELETE: Chỉ cần can_delete('trainees')
CREATE POLICY "trainees_delete_by_menu_permission"
ON public.trainees FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- =====================================================
-- 6. CẬP NHẬT RLS CHO BẢNG trainee_workflow
-- =====================================================
DROP POLICY IF EXISTS "trainee_workflow_select_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_insert_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_update_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_delete_policy" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Users can view trainee_workflow with menu permission" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Users can insert trainee_workflow with menu permission" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Users can update trainee_workflow with menu permission" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Users can delete trainee_workflow with menu permission" ON public.trainee_workflow;

CREATE POLICY "trainee_workflow_select_by_menu"
ON public.trainee_workflow FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "trainee_workflow_insert_by_menu"
ON public.trainee_workflow FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "trainee_workflow_update_by_menu"
ON public.trainee_workflow FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "trainee_workflow_delete_by_menu"
ON public.trainee_workflow FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- =====================================================
-- 7. CẬP NHẬT RLS CHO CÁC BẢNG LIÊN QUAN
-- =====================================================

-- family_members
DROP POLICY IF EXISTS "family_members_select_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete_policy" ON public.family_members;

CREATE POLICY "family_members_select_by_menu"
ON public.family_members FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "family_members_insert_by_menu"
ON public.family_members FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "family_members_update_by_menu"
ON public.family_members FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "family_members_delete_by_menu"
ON public.family_members FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- japan_relatives
DROP POLICY IF EXISTS "japan_relatives_select_policy" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_insert_policy" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_update_policy" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_delete_policy" ON public.japan_relatives;

CREATE POLICY "japan_relatives_select_by_menu"
ON public.japan_relatives FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "japan_relatives_insert_by_menu"
ON public.japan_relatives FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "japan_relatives_update_by_menu"
ON public.japan_relatives FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "japan_relatives_delete_by_menu"
ON public.japan_relatives FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- education_history
DROP POLICY IF EXISTS "education_history_select_policy" ON public.education_history;
DROP POLICY IF EXISTS "education_history_insert_policy" ON public.education_history;
DROP POLICY IF EXISTS "education_history_update_policy" ON public.education_history;
DROP POLICY IF EXISTS "education_history_delete_policy" ON public.education_history;

CREATE POLICY "education_history_select_by_menu"
ON public.education_history FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "education_history_insert_by_menu"
ON public.education_history FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "education_history_update_by_menu"
ON public.education_history FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "education_history_delete_by_menu"
ON public.education_history FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- work_history
DROP POLICY IF EXISTS "work_history_select_policy" ON public.work_history;
DROP POLICY IF EXISTS "work_history_insert_policy" ON public.work_history;
DROP POLICY IF EXISTS "work_history_update_policy" ON public.work_history;
DROP POLICY IF EXISTS "work_history_delete_policy" ON public.work_history;

CREATE POLICY "work_history_select_by_menu"
ON public.work_history FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "work_history_insert_by_menu"
ON public.work_history FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "work_history_update_by_menu"
ON public.work_history FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "work_history_delete_by_menu"
ON public.work_history FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));

-- interview_history
DROP POLICY IF EXISTS "interview_history_select_policy" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_insert_policy" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_update_policy" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_delete_policy" ON public.interview_history;

CREATE POLICY "interview_history_select_by_menu"
ON public.interview_history FOR SELECT
TO authenticated
USING (public.can_view('trainees'));

CREATE POLICY "interview_history_insert_by_menu"
ON public.interview_history FOR INSERT
TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "interview_history_update_by_menu"
ON public.interview_history FOR UPDATE
TO authenticated
USING (public.can_update('trainees'));

CREATE POLICY "interview_history_delete_by_menu"
ON public.interview_history FOR DELETE
TO authenticated
USING (public.can_delete('trainees'));