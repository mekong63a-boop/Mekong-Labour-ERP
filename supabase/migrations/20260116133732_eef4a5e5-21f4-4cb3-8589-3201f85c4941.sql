-- =====================================================
-- PHASE 1: HỆ THỐNG PHÂN QUYỀN MENU MỚI
-- =====================================================

-- 1.1 Tạo bảng menus
CREATE TABLE IF NOT EXISTS public.menus (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  parent_key TEXT REFERENCES public.menus(key) ON DELETE SET NULL,
  path TEXT NOT NULL,
  icon TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS cho menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Mọi user authenticated đều có thể đọc menu structure
CREATE POLICY "menus_select_authenticated" ON public.menus
FOR SELECT TO authenticated USING (true);

-- 1.2 Insert dữ liệu menu mặc định
INSERT INTO public.menus (key, label, parent_key, path, icon, order_index) VALUES
  ('dashboard', 'Tổng quan', NULL, '/', 'LayoutDashboard', 1),
  ('trainees', 'Học viên', NULL, '/trainees', 'Users', 2),
  ('orders', 'Đơn hàng', NULL, '/orders', 'ClipboardList', 3),
  ('partners', 'Đối tác', NULL, '/partners', 'Building2', 4),
  ('internal_ops', 'Nghiệp vụ nội bộ', NULL, '#', 'Building2', 5),
  ('education', 'Đào tạo', 'internal_ops', '/education', 'GraduationCap', 1),
  ('dormitory', 'Quản lý KTX', 'internal_ops', '/dormitory', 'Home', 2),
  ('legal', 'Tình trạng hồ sơ', 'internal_ops', '/legal', 'FileSpreadsheet', 3),
  ('post_departure', 'Sau xuất cảnh', NULL, '/post-departure', 'Plane', 6),
  ('handbook', 'Cẩm nang tư vấn', NULL, '/handbook', 'BookOpen', 7),
  ('violations', 'Blacklist', NULL, '/violations', 'AlertTriangle', 8),
  ('reports', 'Báo cáo', NULL, '/reports', 'FileSpreadsheet', 9),
  ('glossary', 'Từ điển chuyên ngành', NULL, '/glossary', 'Languages', 10),
  ('internal_union', 'Công đoàn nội bộ', NULL, '/internal-union', 'HandCoins', 11),
  ('admin', 'Quản trị hệ thống', NULL, '/admin', 'Shield', 12),
  ('admin_monitor', 'Giám sát hệ thống', 'admin', '/admin?tab=monitor', 'Monitor', 1),
  ('admin_users', 'Quản lý phân quyền', 'admin', '/admin?tab=users', 'Shield', 2),
  ('admin_departments', 'Quản lý phòng ban', 'admin', '/admin?tab=departments', 'Building2', 3)
ON CONFLICT (key) DO NOTHING;

-- 1.3 Tạo bảng user_menu_permissions
CREATE TABLE IF NOT EXISTS public.user_menu_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_key TEXT NOT NULL REFERENCES public.menus(key) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, menu_key)
);

-- Enable RLS
ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;

-- 1.4 Tạo Security Definer Functions mới

-- Kiểm tra Primary Admin (bypass tất cả)
CREATE OR REPLACE FUNCTION public.is_primary_admin_check(_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND is_primary_admin = true
  )
$$;

-- Kiểm tra Admin (có quyền gán quyền menu)
CREATE OR REPLACE FUNCTION public.is_admin_check(_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- CORE FUNCTION: Kiểm tra quyền menu
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
  -- Primary Admin ALWAYS bypasses
  IF public.is_primary_admin_check(_user_id) THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM user_menu_permissions 
    WHERE user_id = _user_id 
      AND menu_key = _menu_key
      AND CASE _action
        WHEN 'view' THEN can_view
        WHEN 'create' THEN can_create
        WHEN 'update' THEN can_update
        WHEN 'delete' THEN can_delete
        ELSE false
      END
  );
END;
$$;

-- Lấy tất cả permissions của user
CREATE OR REPLACE FUNCTION public.get_user_menu_permissions(_user_id UUID)
RETURNS TABLE(
  menu_key TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN
) 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Primary Admin gets everything
  IF public.is_primary_admin_check(_user_id) THEN
    RETURN QUERY 
    SELECT m.key, true::boolean, true::boolean, true::boolean, true::boolean
    FROM menus m;
  ELSE
    RETURN QUERY
    SELECT p.menu_key, p.can_view, p.can_create, p.can_update, p.can_delete
    FROM user_menu_permissions p
    WHERE p.user_id = _user_id;
  END IF;
END;
$$;

-- 1.5 RLS Policies cho user_menu_permissions

-- User có thể xem quyền của chính mình, Admin xem tất cả
CREATE POLICY "ump_select_policy" ON public.user_menu_permissions
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_check(auth.uid())
  OR public.is_primary_admin_check(auth.uid())
);

-- Chỉ Admin có thể insert (KHÔNG THỂ gán cho Primary Admin)
CREATE POLICY "ump_insert_policy" ON public.user_menu_permissions
FOR INSERT TO authenticated
WITH CHECK (
  (public.is_admin_check(auth.uid()) OR public.is_primary_admin_check(auth.uid()))
  AND NOT public.is_primary_admin_check(user_id)
);

-- Chỉ Admin có thể update (KHÔNG THỂ sửa Primary Admin)
CREATE POLICY "ump_update_policy" ON public.user_menu_permissions
FOR UPDATE TO authenticated
USING (
  (public.is_admin_check(auth.uid()) OR public.is_primary_admin_check(auth.uid()))
  AND NOT public.is_primary_admin_check(user_id)
);

-- Chỉ Admin có thể delete (KHÔNG THỂ xóa của Primary Admin)
CREATE POLICY "ump_delete_policy" ON public.user_menu_permissions
FOR DELETE TO authenticated
USING (
  (public.is_admin_check(auth.uid()) OR public.is_primary_admin_check(auth.uid()))
  AND NOT public.is_primary_admin_check(user_id)
);

-- 1.6 Trigger bảo vệ Primary Admin
CREATE OR REPLACE FUNCTION public.protect_primary_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Không cho phép thay đổi is_primary_admin từ true sang false
    IF OLD.is_primary_admin = true AND (NEW.is_primary_admin = false OR NEW.is_primary_admin IS NULL) THEN
      RAISE EXCEPTION 'Cannot modify Primary Admin status';
    END IF;
    -- Không cho phép thay đổi role của Primary Admin
    IF OLD.is_primary_admin = true AND OLD.role != NEW.role THEN
      RAISE EXCEPTION 'Cannot change Primary Admin role';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_primary_admin = true THEN
      RAISE EXCEPTION 'Cannot delete Primary Admin role';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS protect_primary_admin_trigger ON public.user_roles;

-- Tạo trigger mới
CREATE TRIGGER protect_primary_admin_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_primary_admin_role();

-- 1.7 Migration dữ liệu: Gán quyền menu cho users hiện tại dựa trên role cũ

-- Admin (không phải Primary) → tất cả menus với full quyền
INSERT INTO public.user_menu_permissions (user_id, menu_key, can_view, can_create, can_update, can_delete, assigned_by)
SELECT ur.user_id, m.key, true, true, true, true, ur.user_id
FROM public.user_roles ur
CROSS JOIN public.menus m
WHERE ur.role = 'admin' AND (ur.is_primary_admin = false OR ur.is_primary_admin IS NULL)
ON CONFLICT (user_id, menu_key) DO NOTHING;

-- Manager → tất cả trừ admin menus
INSERT INTO public.user_menu_permissions (user_id, menu_key, can_view, can_create, can_update, can_delete, assigned_by)
SELECT ur.user_id, m.key, true, true, true, true, ur.user_id
FROM public.user_roles ur
CROSS JOIN public.menus m
WHERE ur.role = 'manager' AND m.key NOT LIKE 'admin%'
ON CONFLICT (user_id, menu_key) DO NOTHING;

-- Staff → view + create + update (không delete), không có admin, orders, reports, post_departure, internal_union
INSERT INTO public.user_menu_permissions (user_id, menu_key, can_view, can_create, can_update, can_delete, assigned_by)
SELECT ur.user_id, m.key, true, true, true, false, ur.user_id
FROM public.user_roles ur
CROSS JOIN public.menus m
WHERE ur.role = 'staff' 
  AND m.key NOT IN ('orders', 'admin', 'admin_monitor', 'admin_users', 'admin_departments', 'reports', 'post_departure', 'internal_union')
ON CONFLICT (user_id, menu_key) DO NOTHING;

-- Teacher → chỉ education và dashboard
INSERT INTO public.user_menu_permissions (user_id, menu_key, can_view, can_create, can_update, can_delete, assigned_by)
SELECT ur.user_id, m.key, true, true, true, false, ur.user_id
FROM public.user_roles ur
CROSS JOIN public.menus m
WHERE ur.role = 'teacher' AND m.key IN ('dashboard', 'education', 'internal_ops')
ON CONFLICT (user_id, menu_key) DO NOTHING;