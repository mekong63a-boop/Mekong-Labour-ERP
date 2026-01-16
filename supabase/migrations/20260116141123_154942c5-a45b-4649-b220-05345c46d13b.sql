-- ============================================
-- FIX: Triệt để trùng phân quyền
-- ============================================

-- 1. Thêm phòng ban mới: Cộng tác viên
ALTER TYPE public.department_type ADD VALUE IF NOT EXISTS 'collaborator';

-- 2. Tạo bảng quyền menu theo phòng ban
CREATE TABLE IF NOT EXISTS public.department_menu_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,
    menu_key TEXT NOT NULL REFERENCES public.menus(key) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(department, menu_key)
);

-- 3. Enable RLS
ALTER TABLE public.department_menu_permissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies cho department_menu_permissions
CREATE POLICY "Admin can manage department menu permissions"
ON public.department_menu_permissions
FOR ALL
TO authenticated
USING (public.is_admin_check(auth.uid()))
WITH CHECK (public.is_admin_check(auth.uid()));

CREATE POLICY "Authenticated can read department menu permissions"
ON public.department_menu_permissions
FOR SELECT
TO authenticated
USING (true);

-- 5. Xóa cột department trùng lặp trong user_roles (chỉ giữ ở department_members)
-- KHÔNG xóa ngay, chỉ comment để migrate từ từ

-- 6. Tạo function tính quyền cuối cùng = user_permission ∩ department_permission
CREATE OR REPLACE FUNCTION public.get_effective_menu_permissions(_user_id UUID)
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
DECLARE
    is_primary BOOLEAN;
    user_departments TEXT[];
BEGIN
    -- Kiểm tra Primary Admin - bypass tất cả
    SELECT public.is_primary_admin_check(_user_id) INTO is_primary;
    IF is_primary THEN
        RETURN QUERY 
        SELECT m.key, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN, true::BOOLEAN
        FROM menus m;
        RETURN;
    END IF;

    -- Lấy danh sách phòng ban user thuộc về
    SELECT array_agg(DISTINCT dm.department) INTO user_departments
    FROM department_members dm
    WHERE dm.user_id = _user_id;

    -- Nếu user không thuộc phòng ban nào
    IF user_departments IS NULL OR array_length(user_departments, 1) IS NULL THEN
        -- Chỉ trả về quyền cá nhân (nếu có)
        RETURN QUERY
        SELECT 
            p.menu_key,
            p.can_view,
            p.can_create,
            p.can_update,
            p.can_delete
        FROM user_menu_permissions p
        WHERE p.user_id = _user_id;
        RETURN;
    END IF;

    -- Tính giao của: user_permissions AND department_permissions
    RETURN QUERY
    SELECT 
        COALESCE(up.menu_key, dp.menu_key) AS menu_key,
        -- can_view = user có quyền AND ít nhất 1 phòng ban cho phép
        COALESCE(up.can_view, false) AND COALESCE(dp.can_view, false) AS can_view,
        COALESCE(up.can_create, false) AND COALESCE(dp.can_create, false) AS can_create,
        COALESCE(up.can_update, false) AND COALESCE(dp.can_update, false) AS can_update,
        COALESCE(up.can_delete, false) AND COALESCE(dp.can_delete, false) AS can_delete
    FROM user_menu_permissions up
    FULL OUTER JOIN (
        -- Lấy max quyền từ tất cả phòng ban user thuộc về
        SELECT 
            dmp.menu_key,
            bool_or(dmp.can_view) AS can_view,
            bool_or(dmp.can_create) AS can_create,
            bool_or(dmp.can_update) AS can_update,
            bool_or(dmp.can_delete) AS can_delete
        FROM department_menu_permissions dmp
        WHERE dmp.department = ANY(user_departments)
        GROUP BY dmp.menu_key
    ) dp ON up.menu_key = dp.menu_key
    WHERE up.user_id = _user_id
    -- Chỉ trả về menu mà user có quyền VÀ phòng ban cho phép
    AND COALESCE(dp.can_view, false) = true;
END;
$$;

-- 7. Thêm index cho performance
CREATE INDEX IF NOT EXISTS idx_department_menu_perms_dept 
ON public.department_menu_permissions(department);

CREATE INDEX IF NOT EXISTS idx_department_menu_perms_menu 
ON public.department_menu_permissions(menu_key);

CREATE INDEX IF NOT EXISTS idx_department_members_user_dept 
ON public.department_members(user_id, department);

-- 8. Cập nhật constraint cho department_members: cho phép phòng Cộng tác viên không có manager
-- (Không cần sửa trigger vì logic hiện tại đã OK)

-- 9. Insert default department menu permissions cho các phòng ban hiện có
-- Mỗi phòng ban mặc định KHÔNG có quyền menu nào (phải tick rõ ràng)
-- Điều này đảm bảo: có người nhưng chưa cấp menu → KHÔNG THẤY GÌ