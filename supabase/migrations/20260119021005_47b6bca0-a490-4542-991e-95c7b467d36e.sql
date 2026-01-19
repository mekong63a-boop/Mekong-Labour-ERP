-- ================================================
-- BẢNG user_permissions: Quyền chi tiết theo resource.action
-- ================================================

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Đảm bảo mỗi user chỉ có 1 permission_code duy nhất
  UNIQUE (user_id, permission_code)
);

-- Index cho performance
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_code ON public.user_permissions(permission_code);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS: Admin xem tất cả, user xem của mình
CREATE POLICY "user_permissions_select_policy" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) 
    OR user_id = auth.uid()
  );

-- RLS: Chỉ Admin được insert/update/delete
CREATE POLICY "user_permissions_admin_modify" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ================================================
-- FUNCTION: Kiểm tra user có permission_code không
-- ================================================

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission_code = _permission_code
  )
$$;

-- ================================================
-- CẬP NHẬT RLS CHO BẢNG companies
-- ================================================

-- Xóa policies cũ
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;
DROP POLICY IF EXISTS "Staff can view companies" ON public.companies;
DROP POLICY IF EXISTS "Managers can modify companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

-- SELECT: Tất cả authenticated users
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admin HOẶC có permission 'companies.create'
CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'companies.create')
  );

-- UPDATE: Admin HOẶC có permission 'companies.update'
CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'companies.update')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'companies.update')
  );

-- DELETE: Chỉ Admin hoặc có permission 'companies.delete'
CREATE POLICY "companies_delete_policy" ON public.companies
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'companies.delete')
  );

-- ================================================
-- CẬP NHẬT RLS CHO BẢNG unions (tương tự)
-- ================================================

DROP POLICY IF EXISTS "unions_select_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_insert_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_update_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_delete_policy" ON public.unions;
DROP POLICY IF EXISTS "Staff can view unions" ON public.unions;
DROP POLICY IF EXISTS "Managers can modify unions" ON public.unions;

CREATE POLICY "unions_select_policy" ON public.unions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "unions_insert_policy" ON public.unions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'unions.create')
  );

CREATE POLICY "unions_update_policy" ON public.unions
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'unions.update')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'unions.update')
  );

CREATE POLICY "unions_delete_policy" ON public.unions
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'unions.delete')
  );

-- ================================================
-- CẬP NHẬT RLS CHO BẢNG job_categories (tương tự)
-- ================================================

DROP POLICY IF EXISTS "job_categories_select_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_insert_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete_policy" ON public.job_categories;
DROP POLICY IF EXISTS "Staff can view job categories" ON public.job_categories;
DROP POLICY IF EXISTS "Managers can modify job categories" ON public.job_categories;

CREATE POLICY "job_categories_select_policy" ON public.job_categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "job_categories_insert_policy" ON public.job_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'job_categories.create')
  );

CREATE POLICY "job_categories_update_policy" ON public.job_categories
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'job_categories.update')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'job_categories.update')
  );

CREATE POLICY "job_categories_delete_policy" ON public.job_categories
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_permission(auth.uid(), 'job_categories.delete')
  );

-- ================================================
-- TRIGGER: Audit log cho user_permissions
-- ================================================

CREATE TRIGGER audit_user_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();