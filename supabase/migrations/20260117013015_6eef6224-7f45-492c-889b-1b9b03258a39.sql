-- =============================================
-- MIGRATION: Chuẩn hóa phân quyền hệ thống (Phần 1)
-- =============================================
-- Mục tiêu:
-- 1. Thêm column is_senior_staff vào user_roles (không cần thêm enum)
-- 2. Tạo RPC functions cho việc kiểm tra role và sensitive data
-- 3. Cập nhật get_effective_menu_permissions với intersection logic
-- =============================================
-- LOGIC:
-- - Admin (role='admin'): Toàn quyền, xem đầy đủ dữ liệu nhạy cảm
-- - Nhân viên cấp cao (role='staff' AND is_senior_staff=true): Xem đầy đủ dữ liệu nhạy cảm
-- - Nhân viên (role='staff' AND is_senior_staff=false): Chỉ xem dữ liệu đã mask
-- =============================================

-- 1. Thêm column is_senior_staff vào user_roles (nếu chưa có)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_senior_staff BOOLEAN DEFAULT false;

-- 2. Tạo function kiểm tra nhân viên cấp cao
CREATE OR REPLACE FUNCTION public.is_senior_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND is_senior_staff = true
  );
$$;

-- 3. Tạo function kiểm tra có thể xem dữ liệu nhạy cảm
-- Admin và Nhân viên cấp cao được xem đầy đủ
CREATE OR REPLACE FUNCTION public.can_view_sensitive_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'admin'
        OR is_senior_staff = true
      )
  );
$$;

-- 4. Cập nhật function get_effective_menu_permissions để hỗ trợ intersection
-- User AND Department đều phải có quyền thì mới được access
CREATE OR REPLACE FUNCTION public.get_effective_menu_permissions(_user_id uuid)
RETURNS TABLE(
  menu_key text,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_primary_admin boolean;
  _user_departments text[];
BEGIN
  -- Check if user is primary admin
  SELECT COALESCE(is_primary_admin, false) INTO _is_primary_admin
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  -- Primary admin has full access
  IF _is_primary_admin THEN
    RETURN QUERY
    SELECT 
      m.key::text as menu_key,
      true as can_view,
      true as can_create,
      true as can_update,
      true as can_delete
    FROM public.menus m;
    RETURN;
  END IF;

  -- Get user's departments
  SELECT ARRAY_AGG(department) INTO _user_departments
  FROM public.department_members
  WHERE user_id = _user_id;

  -- If user has no departments, use only user-level permissions
  IF _user_departments IS NULL OR array_length(_user_departments, 1) IS NULL THEN
    RETURN QUERY
    SELECT 
      ump.menu_key::text,
      COALESCE(ump.can_view, false),
      COALESCE(ump.can_create, false),
      COALESCE(ump.can_update, false),
      COALESCE(ump.can_delete, false)
    FROM public.user_menu_permissions ump
    WHERE ump.user_id = _user_id;
    RETURN;
  END IF;

  -- Intersection: User permissions AND Department permissions
  RETURN QUERY
  SELECT 
    ump.menu_key::text,
    (COALESCE(ump.can_view, false) AND COALESCE(bool_or(dmp.can_view), true)) as can_view,
    (COALESCE(ump.can_create, false) AND COALESCE(bool_or(dmp.can_create), true)) as can_create,
    (COALESCE(ump.can_update, false) AND COALESCE(bool_or(dmp.can_update), true)) as can_update,
    (COALESCE(ump.can_delete, false) AND COALESCE(bool_or(dmp.can_delete), true)) as can_delete
  FROM public.user_menu_permissions ump
  LEFT JOIN public.department_menu_permissions dmp 
    ON ump.menu_key = dmp.menu_key AND dmp.department = ANY(_user_departments)
  WHERE ump.user_id = _user_id
  GROUP BY ump.menu_key, ump.can_view, ump.can_create, ump.can_update, ump.can_delete;
END;
$$;

-- 5. Tạo function kiểm tra has_menu_permission với intersection logic
CREATE OR REPLACE FUNCTION public.has_menu_permission(_user_id uuid, _menu_key text, _action text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result boolean := false;
  _perm record;
BEGIN
  -- Get effective permissions for this menu
  SELECT * INTO _perm
  FROM public.get_effective_menu_permissions(_user_id)
  WHERE menu_key = _menu_key;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check based on action
  CASE _action
    WHEN 'view' THEN _result := _perm.can_view;
    WHEN 'create' THEN _result := _perm.can_create;
    WHEN 'update' THEN _result := _perm.can_update;
    WHEN 'delete' THEN _result := _perm.can_delete;
    ELSE _result := false;
  END CASE;
  
  RETURN _result;
END;
$$;

-- 6. Comment để giải thích logic
COMMENT ON COLUMN public.user_roles.is_senior_staff IS 'True nếu là nhân viên cấp cao (được xem dữ liệu nhạy cảm)';
COMMENT ON FUNCTION public.is_senior_staff IS 'Kiểm tra user có phải nhân viên cấp cao không';
COMMENT ON FUNCTION public.can_view_sensitive_data IS 'Kiểm tra user có quyền xem dữ liệu nhạy cảm (Admin hoặc Nhân viên cấp cao)';
COMMENT ON FUNCTION public.get_effective_menu_permissions IS 'Lấy quyền menu hiệu lực - intersection của user_menu_permissions AND department_menu_permissions';