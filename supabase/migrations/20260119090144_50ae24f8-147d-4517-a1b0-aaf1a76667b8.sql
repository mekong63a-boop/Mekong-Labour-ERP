-- =====================================================
-- SINGLE SOURCE OF TRUTH - HỢP NHẤT NGUỒN DỮ LIỆU
-- =====================================================

-- 1. XÓA VIEW trainees_masked (vi phạm Single Source - mask theo role)
DROP VIEW IF EXISTS public.trainees_masked CASCADE;

-- 2. CẬP NHẬT VIEW trainees_with_workflow để đọc trực tiếp từ trainees (không mask)
DROP VIEW IF EXISTS public.trainees_with_workflow CASCADE;
CREATE VIEW public.trainees_with_workflow 
WITH (security_invoker = on)
AS
SELECT 
  t.*,
  tw.current_stage,
  tw.sub_status,
  tw.owner_department_id,
  tw.transitioned_at
FROM trainees t
LEFT JOIN trainee_workflow tw ON tw.trainee_id = t.id;

-- 3. CẬP NHẬT trainees_basic để đọc đầy đủ từ trainees (không loại bỏ cột)
DROP VIEW IF EXISTS public.trainees_basic CASCADE;
CREATE VIEW public.trainees_basic
WITH (security_invoker = on)
AS SELECT * FROM trainees;

-- =====================================================
-- CHUẨN HÓA RLS - CHỈ DỰA TRÊN MENU PERMISSIONS
-- =====================================================

-- TRAINEES TABLE
DROP POLICY IF EXISTS "trainees_select" ON public.trainees;
DROP POLICY IF EXISTS "trainees_insert" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete" ON public.trainees;
DROP POLICY IF EXISTS "Authenticated can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "Manager+ can update trainees" ON public.trainees;
DROP POLICY IF EXISTS "Staff and above can manage trainees" ON public.trainees;

CREATE POLICY "trainees_select" ON public.trainees FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "trainees_insert" ON public.trainees FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "trainees_update" ON public.trainees FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "trainees_delete" ON public.trainees FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- TRAINEE_WORKFLOW TABLE
DROP POLICY IF EXISTS "trainee_workflow_select" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_insert" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_update" ON public.trainee_workflow;
DROP POLICY IF EXISTS "trainee_workflow_delete" ON public.trainee_workflow;
DROP POLICY IF EXISTS "Authenticated can view workflow" ON public.trainee_workflow;

CREATE POLICY "trainee_workflow_select" ON public.trainee_workflow FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "trainee_workflow_insert" ON public.trainee_workflow FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "trainee_workflow_update" ON public.trainee_workflow FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "trainee_workflow_delete" ON public.trainee_workflow FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- FAMILY_MEMBERS TABLE
DROP POLICY IF EXISTS "Manager+ can view family_members" ON public.family_members;
DROP POLICY IF EXISTS "Manager+ can update family_members" ON public.family_members;
DROP POLICY IF EXISTS "Manager+ can delete family_members" ON public.family_members;
DROP POLICY IF EXISTS "Staff and above can manage family_members" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;

CREATE POLICY "family_members_select" ON public.family_members FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- JAPAN_RELATIVES TABLE
DROP POLICY IF EXISTS "Manager+ can view japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Manager+ can update japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Manager+ can delete japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "Staff and above can manage japan_relatives" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_delete" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_select" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_insert" ON public.japan_relatives;
DROP POLICY IF EXISTS "japan_relatives_update" ON public.japan_relatives;

CREATE POLICY "japan_relatives_select" ON public.japan_relatives FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "japan_relatives_insert" ON public.japan_relatives FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "japan_relatives_update" ON public.japan_relatives FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "japan_relatives_delete" ON public.japan_relatives FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- EDUCATION_HISTORY TABLE
DROP POLICY IF EXISTS "Staff and above can manage education_history" ON public.education_history;
DROP POLICY IF EXISTS "education_history_delete" ON public.education_history;
DROP POLICY IF EXISTS "education_history_select" ON public.education_history;
DROP POLICY IF EXISTS "education_history_insert" ON public.education_history;
DROP POLICY IF EXISTS "education_history_update" ON public.education_history;

CREATE POLICY "education_history_select" ON public.education_history FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "education_history_insert" ON public.education_history FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "education_history_update" ON public.education_history FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "education_history_delete" ON public.education_history FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- WORK_HISTORY TABLE
DROP POLICY IF EXISTS "work_history_select" ON public.work_history;
DROP POLICY IF EXISTS "work_history_insert" ON public.work_history;
DROP POLICY IF EXISTS "work_history_update" ON public.work_history;
DROP POLICY IF EXISTS "work_history_delete" ON public.work_history;
DROP POLICY IF EXISTS "Staff and above can manage work_history" ON public.work_history;

CREATE POLICY "work_history_select" ON public.work_history FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "work_history_insert" ON public.work_history FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "work_history_update" ON public.work_history FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "work_history_delete" ON public.work_history FOR DELETE TO authenticated
USING (can_delete('trainees'));

-- INTERVIEW_HISTORY TABLE
DROP POLICY IF EXISTS "Staff and above can manage interview_history" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_delete" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_select" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_insert" ON public.interview_history;
DROP POLICY IF EXISTS "interview_history_update" ON public.interview_history;

CREATE POLICY "interview_history_select" ON public.interview_history FOR SELECT TO authenticated
USING (can_view('trainees'));

CREATE POLICY "interview_history_insert" ON public.interview_history FOR INSERT TO authenticated
WITH CHECK (can_insert('trainees'));

CREATE POLICY "interview_history_update" ON public.interview_history FOR UPDATE TO authenticated
USING (can_update('trainees'));

CREATE POLICY "interview_history_delete" ON public.interview_history FOR DELETE TO authenticated
USING (can_delete('trainees'));