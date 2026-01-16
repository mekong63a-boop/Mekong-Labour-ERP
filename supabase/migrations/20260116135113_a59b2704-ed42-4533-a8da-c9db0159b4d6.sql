-- ========================================
-- PHASE 1: Cập nhật menu - XÓA sub-menus admin (chỉ dùng tabs)
-- ========================================

-- Xóa các menu con của admin (sẽ là tabs bên trong page)
DELETE FROM public.menus WHERE key IN ('admin_monitor', 'admin_users', 'admin_departments');

-- Xóa user_menu_permissions liên quan đến các menu con đã xóa
-- (trigger ON DELETE CASCADE sẽ xử lý nếu có FK, nhưng đảm bảo xóa sạch)
DELETE FROM public.user_menu_permissions WHERE menu_key IN ('admin_monitor', 'admin_users', 'admin_departments');

-- ========================================
-- PHASE 2: Tạo bảng department_members để quản lý nhân sự phòng ban
-- ========================================

-- Bảng lưu quan hệ user - department với role trong phòng ban
CREATE TABLE IF NOT EXISTS public.department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  role_in_department TEXT NOT NULL CHECK (role_in_department IN ('manager', 'staff')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Mỗi user chỉ có 1 role trong 1 department
  UNIQUE(user_id, department)
);

-- Index cho query nhanh
CREATE INDEX IF NOT EXISTS idx_department_members_dept ON public.department_members(department);
CREATE INDEX IF NOT EXISTS idx_department_members_user ON public.department_members(user_id);

-- Enable RLS
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PHASE 3: RLS Policies cho department_members
-- ========================================

-- Tất cả authenticated users có thể xem danh sách nhân sự phòng ban
CREATE POLICY "department_members_select" ON public.department_members
FOR SELECT TO authenticated
USING (true);

-- Chỉ Admin mới có thể thêm/sửa/xóa nhân sự phòng ban
CREATE POLICY "department_members_insert" ON public.department_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_check(auth.uid())
);

CREATE POLICY "department_members_update" ON public.department_members
FOR UPDATE TO authenticated
USING (
  public.is_admin_check(auth.uid())
);

CREATE POLICY "department_members_delete" ON public.department_members
FOR DELETE TO authenticated
USING (
  public.is_admin_check(auth.uid())
);

-- ========================================
-- PHASE 4: Function để đảm bảo chỉ có 1 manager per department
-- ========================================

CREATE OR REPLACE FUNCTION public.ensure_single_manager_per_department()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu đang gán role manager
  IF NEW.role_in_department = 'manager' THEN
    -- Xóa manager cũ của department này (nếu có)
    DELETE FROM public.department_members 
    WHERE department = NEW.department 
      AND role_in_department = 'manager'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_single_manager
BEFORE INSERT OR UPDATE ON public.department_members
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_manager_per_department();

-- ========================================
-- PHASE 5: Functions helper cho department management
-- ========================================

-- Lấy danh sách members của 1 department
CREATE OR REPLACE FUNCTION public.get_department_members(_department TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  role_in_department TEXT,
  assigned_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT 
    dm.id,
    dm.user_id,
    dm.role_in_department,
    dm.assigned_at,
    p.email,
    p.full_name
  FROM department_members dm
  JOIN profiles p ON p.user_id = dm.user_id
  WHERE dm.department = _department
  ORDER BY 
    CASE dm.role_in_department WHEN 'manager' THEN 0 ELSE 1 END,
    p.full_name;
$$;

-- Đếm số lượng thành viên mỗi department
CREATE OR REPLACE FUNCTION public.get_department_counts()
RETURNS TABLE(
  department TEXT,
  manager_count INT,
  staff_count INT,
  total_count INT
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT 
    dm.department,
    COUNT(*) FILTER (WHERE dm.role_in_department = 'manager')::INT as manager_count,
    COUNT(*) FILTER (WHERE dm.role_in_department = 'staff')::INT as staff_count,
    COUNT(*)::INT as total_count
  FROM department_members dm
  GROUP BY dm.department;
$$;

-- ========================================
-- PHASE 6: Migrate dữ liệu từ user_roles.department sang department_members
-- ========================================

-- Migrate managers (role = 'manager' với department không null)
INSERT INTO public.department_members (user_id, department, role_in_department)
SELECT user_id, department, 'manager'
FROM public.user_roles
WHERE department IS NOT NULL AND role = 'manager'
ON CONFLICT (user_id, department) DO NOTHING;

-- Migrate staff (role = 'staff' với department không null)  
INSERT INTO public.department_members (user_id, department, role_in_department)
SELECT user_id, department, 'staff'
FROM public.user_roles
WHERE department IS NOT NULL AND role = 'staff'
ON CONFLICT (user_id, department) DO NOTHING;