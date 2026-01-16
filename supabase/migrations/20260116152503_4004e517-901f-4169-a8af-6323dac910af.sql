-- Fix: Khi phòng ban chưa có permission cấu hình nào -> user thấy tất cả menu
-- Giữ logic giao quyền khi phòng ban ĐÃ cấu hình
CREATE OR REPLACE FUNCTION public.get_effective_menu_permissions(_user_id uuid)
RETURNS TABLE(menu_key text, can_view boolean, can_create boolean, can_update boolean, can_delete boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_primary BOOLEAN;
  is_admin_user BOOLEAN;
  user_departments TEXT[];
  has_dept_config BOOLEAN;
BEGIN
  -- Primary Admin: full access to all menus
  SELECT public.is_primary_admin_check(_user_id) INTO is_primary;
  IF is_primary THEN
    RETURN QUERY
    SELECT m.key, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN
    FROM public.menus m;
    RETURN;
  END IF;

  -- Admin role: full access to all menus
  SELECT public.is_admin_check(_user_id) INTO is_admin_user;
  IF is_admin_user THEN
    RETURN QUERY
    SELECT m.key, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN
    FROM public.menus m;
    RETURN;
  END IF;

  -- Departments the user belongs to
  SELECT array_agg(DISTINCT dm.department) INTO user_departments
  FROM public.department_members dm
  WHERE dm.user_id = _user_id;

  -- If user has no department -> show all menus with view-only (fallback for users without dept)
  IF user_departments IS NULL OR array_length(user_departments, 1) IS NULL THEN
    RETURN QUERY
    SELECT m.key, true::BOOLEAN, false::BOOLEAN, false::BOOLEAN, false::BOOLEAN
    FROM public.menus m;
    RETURN;
  END IF;

  -- Check if ANY of user's departments have permissions configured
  SELECT EXISTS (
    SELECT 1 FROM public.department_menu_permissions dmp
    WHERE dmp.department = ANY(user_departments)
  ) INTO has_dept_config;

  -- If NO department has any permission configured -> show all menus (fallback)
  IF NOT has_dept_config THEN
    RETURN QUERY
    SELECT m.key, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN
    FROM public.menus m;
    RETURN;
  END IF;

  -- Departments HAVE permissions configured -> use configured permissions
  RETURN QUERY
  SELECT
    dp.menu_key,
    dp.can_view,
    dp.can_create,
    dp.can_update,
    dp.can_delete
  FROM (
    SELECT
      dmp.menu_key,
      bool_or(COALESCE(dmp.can_view, false)) AS can_view,
      bool_or(COALESCE(dmp.can_create, false)) AS can_create,
      bool_or(COALESCE(dmp.can_update, false)) AS can_update,
      bool_or(COALESCE(dmp.can_delete, false)) AS can_delete
    FROM public.department_menu_permissions dmp
    WHERE dmp.department = ANY(user_departments)
    GROUP BY dmp.menu_key
  ) dp
  WHERE dp.can_view = true;
END;
$$;