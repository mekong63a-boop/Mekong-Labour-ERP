-- =====================================================
-- THIẾT LẬP HỆ THỐNG PHÂN QUYỀN MỚI
-- NGUỒN DUY NHẤT: user_menu_permissions
-- =====================================================

-- 1. TẠO FUNCTION KIỂM TRA QUYỀN MENU (NGUỒN DUY NHẤT)
CREATE OR REPLACE FUNCTION public.has_menu_permission(
  _user_id UUID, 
  _menu_key TEXT, 
  _action TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chỉ Primary Admin bypass tất cả
  IF public.is_primary_admin_check(_user_id) THEN
    RETURN true;
  END IF;
  
  -- Các user khác (kể cả Admin phụ, Senior Staff) phải có quyền được tick
  RETURN EXISTS (
    SELECT 1
    FROM public.user_menu_permissions ump
    WHERE ump.user_id = _user_id
      AND ump.menu_key = _menu_key
      AND (
        CASE _action
          WHEN 'view' THEN ump.can_view = true
          WHEN 'create' THEN ump.can_create = true
          WHEN 'update' THEN ump.can_update = true
          WHEN 'delete' THEN ump.can_delete = true
          ELSE false
        END
      )
  );
END;
$$;

-- 2. TẠO FUNCTION WRAPPER CHO RLS (đơn giản hóa việc gọi)
CREATE OR REPLACE FUNCTION public.can_insert(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_menu_permission(auth.uid(), _menu_key, 'create')
$$;

CREATE OR REPLACE FUNCTION public.can_update(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_menu_permission(auth.uid(), _menu_key, 'update')
$$;

CREATE OR REPLACE FUNCTION public.can_delete(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_menu_permission(auth.uid(), _menu_key, 'delete')
$$;

CREATE OR REPLACE FUNCTION public.can_view(_menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_menu_permission(auth.uid(), _menu_key, 'view')
$$;

-- 3. CẬP NHẬT RLS CHO COMPANIES (menu_key = 'partners')
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('partners'));

CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE TO authenticated
USING (public.can_update('partners'))
WITH CHECK (public.can_update('partners'));

CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE TO authenticated
USING (public.can_delete('partners'));

-- 4. CẬP NHẬT RLS CHO UNIONS
DROP POLICY IF EXISTS "unions_insert_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_update_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_delete_policy" ON public.unions;

CREATE POLICY "unions_insert_policy" ON public.unions
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('partners'));

CREATE POLICY "unions_update_policy" ON public.unions
FOR UPDATE TO authenticated
USING (public.can_update('partners'))
WITH CHECK (public.can_update('partners'));

CREATE POLICY "unions_delete_policy" ON public.unions
FOR DELETE TO authenticated
USING (public.can_delete('partners'));

-- 5. CẬP NHẬT RLS CHO JOB_CATEGORIES
DROP POLICY IF EXISTS "job_categories_insert_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete_policy" ON public.job_categories;

CREATE POLICY "job_categories_insert_policy" ON public.job_categories
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('partners'));

CREATE POLICY "job_categories_update_policy" ON public.job_categories
FOR UPDATE TO authenticated
USING (public.can_update('partners'))
WITH CHECK (public.can_update('partners'));

CREATE POLICY "job_categories_delete_policy" ON public.job_categories
FOR DELETE TO authenticated
USING (public.can_delete('partners'));

-- 6. CẬP NHẬT RLS CHO ORDERS (menu_key = 'orders')
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('orders'));

CREATE POLICY "orders_update_policy" ON public.orders
FOR UPDATE TO authenticated
USING (public.can_update('orders'))
WITH CHECK (public.can_update('orders'));

CREATE POLICY "orders_delete_policy" ON public.orders
FOR DELETE TO authenticated
USING (public.can_delete('orders'));

-- 7. CẬP NHẬT RLS CHO TRAINEES (menu_key = 'trainees')
DROP POLICY IF EXISTS "trainees_insert_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update_policy" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete_policy" ON public.trainees;

CREATE POLICY "trainees_insert_policy" ON public.trainees
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('trainees'));

CREATE POLICY "trainees_update_policy" ON public.trainees
FOR UPDATE TO authenticated
USING (public.can_update('trainees'))
WITH CHECK (public.can_update('trainees'));

CREATE POLICY "trainees_delete_policy" ON public.trainees
FOR DELETE TO authenticated
USING (public.can_delete('trainees'));

-- 8. CẬP NHẬT RLS CHO CLASSES (menu_key = 'education')
DROP POLICY IF EXISTS "classes_insert_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_update_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON public.classes;

CREATE POLICY "classes_insert_policy" ON public.classes
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('education'));

CREATE POLICY "classes_update_policy" ON public.classes
FOR UPDATE TO authenticated
USING (public.can_update('education'))
WITH CHECK (public.can_update('education'));

CREATE POLICY "classes_delete_policy" ON public.classes
FOR DELETE TO authenticated
USING (public.can_delete('education'));

-- 9. CẬP NHẬT RLS CHO TEACHERS
DROP POLICY IF EXISTS "teachers_insert_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON public.teachers;

CREATE POLICY "teachers_insert_policy" ON public.teachers
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('education'));

CREATE POLICY "teachers_update_policy" ON public.teachers
FOR UPDATE TO authenticated
USING (public.can_update('education'))
WITH CHECK (public.can_update('education'));

CREATE POLICY "teachers_delete_policy" ON public.teachers
FOR DELETE TO authenticated
USING (public.can_delete('education'));

-- 10. CẬP NHẬT RLS CHO TEST_SCORES
DROP POLICY IF EXISTS "test_scores_insert_policy" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_update_policy" ON public.test_scores;
DROP POLICY IF EXISTS "test_scores_delete_policy" ON public.test_scores;

CREATE POLICY "test_scores_insert_policy" ON public.test_scores
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('education'));

CREATE POLICY "test_scores_update_policy" ON public.test_scores
FOR UPDATE TO authenticated
USING (public.can_update('education'))
WITH CHECK (public.can_update('education'));

CREATE POLICY "test_scores_delete_policy" ON public.test_scores
FOR DELETE TO authenticated
USING (public.can_delete('education'));

-- 11. CẬP NHẬT RLS CHO ATTENDANCE
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete_policy" ON public.attendance;

CREATE POLICY "attendance_insert_policy" ON public.attendance
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('education'));

CREATE POLICY "attendance_update_policy" ON public.attendance
FOR UPDATE TO authenticated
USING (public.can_update('education'))
WITH CHECK (public.can_update('education'));

CREATE POLICY "attendance_delete_policy" ON public.attendance
FOR DELETE TO authenticated
USING (public.can_delete('education'));

-- 12. CẬP NHẬT RLS CHO GLOSSARY TABLES (vocabulary, katakana_names, religions, referral_sources, policy_categories)
-- vocabulary
DROP POLICY IF EXISTS "vocabulary_insert_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_update_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_delete_policy" ON public.vocabulary;

CREATE POLICY "vocabulary_insert_policy" ON public.vocabulary
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('glossary'));

CREATE POLICY "vocabulary_update_policy" ON public.vocabulary
FOR UPDATE TO authenticated
USING (public.can_update('glossary'))
WITH CHECK (public.can_update('glossary'));

CREATE POLICY "vocabulary_delete_policy" ON public.vocabulary
FOR DELETE TO authenticated
USING (public.can_delete('glossary'));

-- katakana_names
DROP POLICY IF EXISTS "katakana_insert_policy" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_update_policy" ON public.katakana_names;
DROP POLICY IF EXISTS "katakana_delete_policy" ON public.katakana_names;

CREATE POLICY "katakana_insert_policy" ON public.katakana_names
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('glossary'));

CREATE POLICY "katakana_update_policy" ON public.katakana_names
FOR UPDATE TO authenticated
USING (public.can_update('glossary'))
WITH CHECK (public.can_update('glossary'));

CREATE POLICY "katakana_delete_policy" ON public.katakana_names
FOR DELETE TO authenticated
USING (public.can_delete('glossary'));

-- religions
DROP POLICY IF EXISTS "religions_insert_policy" ON public.religions;
DROP POLICY IF EXISTS "religions_update_policy" ON public.religions;
DROP POLICY IF EXISTS "religions_delete_policy" ON public.religions;

CREATE POLICY "religions_insert_policy" ON public.religions
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('glossary'));

CREATE POLICY "religions_update_policy" ON public.religions
FOR UPDATE TO authenticated
USING (public.can_update('glossary'))
WITH CHECK (public.can_update('glossary'));

CREATE POLICY "religions_delete_policy" ON public.religions
FOR DELETE TO authenticated
USING (public.can_delete('glossary'));

-- referral_sources
DROP POLICY IF EXISTS "referral_sources_insert_policy" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_update_policy" ON public.referral_sources;
DROP POLICY IF EXISTS "referral_sources_delete_policy" ON public.referral_sources;

CREATE POLICY "referral_sources_insert_policy" ON public.referral_sources
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('glossary'));

CREATE POLICY "referral_sources_update_policy" ON public.referral_sources
FOR UPDATE TO authenticated
USING (public.can_update('glossary'))
WITH CHECK (public.can_update('glossary'));

CREATE POLICY "referral_sources_delete_policy" ON public.referral_sources
FOR DELETE TO authenticated
USING (public.can_delete('glossary'));

-- policy_categories
DROP POLICY IF EXISTS "policy_categories_insert_policy" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_update_policy" ON public.policy_categories;
DROP POLICY IF EXISTS "policy_categories_delete_policy" ON public.policy_categories;

CREATE POLICY "policy_categories_insert_policy" ON public.policy_categories
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('glossary'));

CREATE POLICY "policy_categories_update_policy" ON public.policy_categories
FOR UPDATE TO authenticated
USING (public.can_update('glossary'))
WITH CHECK (public.can_update('glossary'));

CREATE POLICY "policy_categories_delete_policy" ON public.policy_categories
FOR DELETE TO authenticated
USING (public.can_delete('glossary'));

-- 13. CẬP NHẬT RLS CHO INTERNAL UNION (union_members, union_transactions)
DROP POLICY IF EXISTS "union_members_insert_policy" ON public.union_members;
DROP POLICY IF EXISTS "union_members_update_policy" ON public.union_members;
DROP POLICY IF EXISTS "union_members_delete_policy" ON public.union_members;

CREATE POLICY "union_members_insert_policy" ON public.union_members
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('internal-union'));

CREATE POLICY "union_members_update_policy" ON public.union_members
FOR UPDATE TO authenticated
USING (public.can_update('internal-union'))
WITH CHECK (public.can_update('internal-union'));

CREATE POLICY "union_members_delete_policy" ON public.union_members
FOR DELETE TO authenticated
USING (public.can_delete('internal-union'));

-- union_transactions
DROP POLICY IF EXISTS "union_transactions_insert_policy" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_update_policy" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_delete_policy" ON public.union_transactions;

CREATE POLICY "union_transactions_insert_policy" ON public.union_transactions
FOR INSERT TO authenticated
WITH CHECK (public.can_insert('internal-union'));

CREATE POLICY "union_transactions_update_policy" ON public.union_transactions
FOR UPDATE TO authenticated
USING (public.can_update('internal-union'))
WITH CHECK (public.can_update('internal-union'));

CREATE POLICY "union_transactions_delete_policy" ON public.union_transactions
FOR DELETE TO authenticated
USING (public.can_delete('internal-union'));

-- 14. CẬP NHẬT TRIGGER ĐỂ BUMP VERSION KHI QUYỀN THAY ĐỔI
-- Đã có trigger cho user_menu_permissions và user_permissions
-- Giờ đảm bảo chỉ cần user_menu_permissions là đủ

-- 15. XÓA FUNCTION HAS_PERMISSION CŨ NẾU KHÔNG CÒN DÙNG
-- (Giữ lại để backward compatibility, nhưng không dùng trong RLS mới)

COMMENT ON FUNCTION public.has_menu_permission IS 
'NGUỒN QUYỀN DUY NHẤT: Kiểm tra user có quyền action trên menu_key không. Chỉ Primary Admin bypass.';