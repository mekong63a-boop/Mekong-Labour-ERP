-- 1. Thêm cột can_export vào user_menu_permissions
ALTER TABLE public.user_menu_permissions 
ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;

-- 2. Thêm cột can_export vào department_menu_permissions
ALTER TABLE public.department_menu_permissions 
ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;

-- 3. DROP và tạo lại function get_user_merged_permissions với can_export
DROP FUNCTION IF EXISTS public.get_user_merged_permissions(uuid);

CREATE FUNCTION public.get_user_merged_permissions(_user_id uuid)
RETURNS TABLE (
  menu_key text,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  can_export boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  user_perms AS (
    SELECT 
      ump.menu_key,
      COALESCE(ump.can_view, false) as can_view,
      COALESCE(ump.can_create, false) as can_create,
      COALESCE(ump.can_update, false) as can_update,
      COALESCE(ump.can_delete, false) as can_delete,
      COALESCE(ump.can_export, false) as can_export
    FROM user_menu_permissions ump
    WHERE ump.user_id = _user_id
  ),
  dept_perms AS (
    SELECT 
      dmp.menu_key,
      bool_or(COALESCE(dmp.can_view, false)) as can_view,
      bool_or(COALESCE(dmp.can_create, false)) as can_create,
      bool_or(COALESCE(dmp.can_update, false)) as can_update,
      bool_or(COALESCE(dmp.can_delete, false)) as can_delete,
      bool_or(COALESCE(dmp.can_export, false)) as can_export
    FROM department_menu_permissions dmp
    INNER JOIN department_members dm ON dm.department = dmp.department
    WHERE dm.user_id = _user_id
    GROUP BY dmp.menu_key
  ),
  all_keys AS (
    SELECT up.menu_key FROM user_perms up
    UNION
    SELECT dp.menu_key FROM dept_perms dp
  )
  SELECT 
    ak.menu_key,
    COALESCE(up.can_view, false) OR COALESCE(dp.can_view, false) as can_view,
    COALESCE(up.can_create, false) OR COALESCE(dp.can_create, false) as can_create,
    COALESCE(up.can_update, false) OR COALESCE(dp.can_update, false) as can_update,
    COALESCE(up.can_delete, false) OR COALESCE(dp.can_delete, false) as can_delete,
    COALESCE(up.can_export, false) OR COALESCE(dp.can_export, false) as can_export
  FROM all_keys ak
  LEFT JOIN user_perms up ON ak.menu_key = up.menu_key
  LEFT JOIN dept_perms dp ON ak.menu_key = dp.menu_key;
END;
$$;

-- 4. DROP và tạo lại function get_department_menu_permissions với can_export
DROP FUNCTION IF EXISTS public.get_department_menu_permissions(text);

CREATE FUNCTION public.get_department_menu_permissions(_department text)
RETURNS TABLE (
  id uuid,
  department text,
  menu_key text,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  can_export boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dmp.id,
    dmp.department,
    dmp.menu_key,
    COALESCE(dmp.can_view, false),
    COALESCE(dmp.can_create, false),
    COALESCE(dmp.can_update, false),
    COALESCE(dmp.can_delete, false),
    COALESCE(dmp.can_export, false)
  FROM department_menu_permissions dmp
  WHERE dmp.department = _department;
END;
$$;

-- 5. DROP và tạo lại function save_department_menu_permissions với can_export
DROP FUNCTION IF EXISTS public.save_department_menu_permissions(text, jsonb, uuid);

CREATE FUNCTION public.save_department_menu_permissions(
  _department text,
  _permissions jsonb,
  _assigned_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM department_menu_permissions WHERE department = _department;
  
  INSERT INTO department_menu_permissions (department, menu_key, can_view, can_create, can_update, can_delete, can_export, assigned_by, assigned_at)
  SELECT 
    _department,
    (perm->>'menu_key')::text,
    COALESCE((perm->>'can_view')::boolean, false),
    COALESCE((perm->>'can_create')::boolean, false),
    COALESCE((perm->>'can_update')::boolean, false),
    COALESCE((perm->>'can_delete')::boolean, false),
    COALESCE((perm->>'can_export')::boolean, false),
    _assigned_by,
    now()
  FROM jsonb_array_elements(_permissions) AS perm
  WHERE (perm->>'can_view')::boolean = true;
END;
$$;