-- 1) User access versioning (menu + db permissions)
CREATE TABLE IF NOT EXISTS public.user_access_versions (
  user_id UUID PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_access_versions ENABLE ROW LEVEL SECURITY;

-- Users can read their own version (used for cache busting)
DO $$ BEGIN
  CREATE POLICY "user_access_versions_select_own"
  ON public.user_access_versions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins can write versions directly (normally written by triggers)
DO $$ BEGIN
  CREATE POLICY "user_access_versions_admin_write"
  ON public.user_access_versions
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: touch version row for a user
CREATE OR REPLACE FUNCTION public.touch_user_access_version(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_access_versions (user_id, updated_at)
  VALUES (_user_id, now())
  ON CONFLICT (user_id)
  DO UPDATE SET updated_at = EXCLUDED.updated_at;
END;
$$;

-- Triggers: when permissions change, bump version
CREATE OR REPLACE FUNCTION public.bump_user_access_version_from_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id);
  PERFORM public.touch_user_access_version(_uid);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_bump_access_version_user_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.bump_user_access_version_from_permissions();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_bump_access_version_user_menu_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_menu_permissions
  FOR EACH ROW EXECUTE FUNCTION public.bump_user_access_version_from_permissions();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2) Enforce partner CRUD strictly by user_permissions (no role shortcut)
-- Companies
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'companies.create'));

CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'companies.update'))
WITH CHECK (public.has_permission(auth.uid(), 'companies.update'));

CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'companies.delete'));

-- Unions
DROP POLICY IF EXISTS "unions_insert_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_update_policy" ON public.unions;
DROP POLICY IF EXISTS "unions_delete_policy" ON public.unions;

CREATE POLICY "unions_insert_policy" ON public.unions
FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'unions.create'));

CREATE POLICY "unions_update_policy" ON public.unions
FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'unions.update'))
WITH CHECK (public.has_permission(auth.uid(), 'unions.update'));

CREATE POLICY "unions_delete_policy" ON public.unions
FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'unions.delete'));

-- Job categories
DROP POLICY IF EXISTS "job_categories_insert_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_update_policy" ON public.job_categories;
DROP POLICY IF EXISTS "job_categories_delete_policy" ON public.job_categories;

CREATE POLICY "job_categories_insert_policy" ON public.job_categories
FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'job_categories.create'));

CREATE POLICY "job_categories_update_policy" ON public.job_categories
FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'job_categories.update'))
WITH CHECK (public.has_permission(auth.uid(), 'job_categories.update'));

CREATE POLICY "job_categories_delete_policy" ON public.job_categories
FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'job_categories.delete'));
