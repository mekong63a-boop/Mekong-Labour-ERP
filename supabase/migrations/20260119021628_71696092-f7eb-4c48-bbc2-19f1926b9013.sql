-- =============================================
-- 1. DROP ALL CONFLICTING/DUPLICATE RLS POLICIES
-- =============================================

-- Companies: Remove old duplicate policies
DROP POLICY IF EXISTS "Manager+ can view companies" ON public.companies;
DROP POLICY IF EXISTS "Manager+ can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Manager+ can update companies" ON public.companies;
DROP POLICY IF EXISTS "Manager+ can delete companies" ON public.companies;
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;

-- Unions: Remove old policies
DROP POLICY IF EXISTS "Manager+ can view unions" ON public.unions;
DROP POLICY IF EXISTS "Manager+ can insert unions" ON public.unions;
DROP POLICY IF EXISTS "Manager+ can update unions" ON public.unions;
DROP POLICY IF EXISTS "Manager+ can delete unions" ON public.unions;
DROP POLICY IF EXISTS "unions_select" ON public.unions;
DROP POLICY IF EXISTS "unions_insert" ON public.unions;
DROP POLICY IF EXISTS "unions_update" ON public.unions;
DROP POLICY IF EXISTS "unions_delete" ON public.unions;

-- Job Categories: Remove old policies
DROP POLICY IF EXISTS "Manager+ can view job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Manager+ can insert job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Manager+ can update job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "Manager+ can delete job_categories" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_select" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_insert" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete" ON public.job_categories;

-- =============================================
-- 2. RECREATE CLEAN RLS POLICIES 
-- Using permission-based system + senior staff support
-- =============================================

-- Companies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- SELECT: All authenticated users can view
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT TO authenticated
USING (true);

-- INSERT: Admin OR senior_staff OR has permission 'companies.create'
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'companies.create')
);

-- UPDATE: Admin OR senior_staff OR has permission 'companies.update'
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'companies.update')
)
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'companies.update')
);

-- DELETE: Admin OR has permission 'companies.delete'
CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.has_permission(auth.uid(), 'companies.delete')
);

-- =============================================
-- Unions
-- =============================================
DROP POLICY IF EXISTS "unions_select_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_insert_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_update_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_delete_policy" ON public.unions;

CREATE POLICY "unions_select_policy" ON public.unions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "unions_insert_policy" ON public.unions
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'unions.create')
);

CREATE POLICY "unions_update_policy" ON public.unions
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'unions.update')
)
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'unions.update')
);

CREATE POLICY "unions_delete_policy" ON public.unions
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.has_permission(auth.uid(), 'unions.delete')
);

-- =============================================
-- Job Categories
-- =============================================
DROP POLICY IF EXISTS "job_categories_select_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_insert_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete_policy" ON public.job_categories;

CREATE POLICY "job_categories_select_policy" ON public.job_categories
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "job_categories_insert_policy" ON public.job_categories
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'job_categories.create')
);

CREATE POLICY "job_categories_update_policy" ON public.job_categories
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'job_categories.update')
)
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.is_senior_staff(auth.uid())
  OR public.has_permission(auth.uid(), 'job_categories.update')
);

CREATE POLICY "job_categories_delete_policy" ON public.job_categories
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR public.has_permission(auth.uid(), 'job_categories.delete')
);