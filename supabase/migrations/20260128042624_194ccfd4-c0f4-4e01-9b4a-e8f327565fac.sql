-- Drop function cũ trước
DROP FUNCTION IF EXISTS public.has_menu_permission(uuid, text, text);

-- =====================================================
-- CẬP NHẬT FUNCTION KIỂM TRA QUYỀN
-- =====================================================
-- Giờ kiểm tra CẢ quyền cá nhân VÀ quyền phòng ban

CREATE OR REPLACE FUNCTION public.has_menu_permission(
    _user_id UUID,
    _menu_key TEXT,
    _permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _is_primary_admin BOOLEAN;
    _has_user_perm BOOLEAN := false;
    _has_dept_perm BOOLEAN := false;
BEGIN
    -- 1. Primary Admin luôn có tất cả quyền
    SELECT COALESCE(is_primary_admin, false) INTO _is_primary_admin
    FROM public.user_roles
    WHERE user_id = _user_id;
    
    IF _is_primary_admin = true THEN
        RETURN true;
    END IF;

    -- 2. Kiểm tra quyền cá nhân (user_menu_permissions)
    SELECT CASE _permission
        WHEN 'view' THEN COALESCE(can_view, false)
        WHEN 'create' THEN COALESCE(can_create, false)
        WHEN 'update' THEN COALESCE(can_update, false)
        WHEN 'delete' THEN COALESCE(can_delete, false)
        ELSE false
    END INTO _has_user_perm
    FROM public.user_menu_permissions
    WHERE user_id = _user_id AND menu_key = _menu_key;

    IF _has_user_perm = true THEN
        RETURN true;
    END IF;

    -- 3. Kiểm tra quyền phòng ban (department_menu_permissions)
    -- User có thể thuộc nhiều phòng ban, chỉ cần 1 phòng có quyền là đủ
    SELECT EXISTS (
        SELECT 1
        FROM public.department_members dm
        JOIN public.department_menu_permissions dmp 
            ON dm.department = dmp.department
        WHERE dm.user_id = _user_id
          AND dmp.menu_key = _menu_key
          AND CASE _permission
              WHEN 'view' THEN COALESCE(dmp.can_view, false)
              WHEN 'create' THEN COALESCE(dmp.can_create, false)
              WHEN 'update' THEN COALESCE(dmp.can_update, false)
              WHEN 'delete' THEN COALESCE(dmp.can_delete, false)
              ELSE false
          END = true
    ) INTO _has_dept_perm;

    RETURN _has_dept_perm;
END;
$$;

-- =====================================================
-- FUNCTION LẤY TẤT CẢ QUYỀN CỦA USER (cho frontend)
-- =====================================================
-- Kết hợp quyền cá nhân + quyền phòng ban

CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(_user_id UUID)
RETURNS TABLE (
    menu_key TEXT,
    can_view BOOLEAN,
    can_create BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    source TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Quyền cá nhân
    SELECT 
        ump.menu_key,
        COALESCE(ump.can_view, false),
        COALESCE(ump.can_create, false),
        COALESCE(ump.can_update, false),
        COALESCE(ump.can_delete, false),
        'user'::TEXT as source
    FROM public.user_menu_permissions ump
    WHERE ump.user_id = _user_id
    
    UNION ALL
    
    -- Quyền từ phòng ban
    SELECT 
        dmp.menu_key,
        COALESCE(dmp.can_view, false),
        COALESCE(dmp.can_create, false),
        COALESCE(dmp.can_update, false),
        COALESCE(dmp.can_delete, false),
        ('department:' || dm.department)::TEXT as source
    FROM public.department_members dm
    JOIN public.department_menu_permissions dmp ON dm.department = dmp.department
    WHERE dm.user_id = _user_id;
END;
$$;

-- =====================================================
-- FUNCTION LẤY QUYỀN ĐÃ GỘP (OR logic)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_merged_permissions(_user_id UUID)
RETURNS TABLE (
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
    RETURN QUERY
    SELECT 
        ep.menu_key,
        bool_or(ep.can_view) as can_view,
        bool_or(ep.can_create) as can_create,
        bool_or(ep.can_update) as can_update,
        bool_or(ep.can_delete) as can_delete
    FROM public.get_user_effective_permissions(_user_id) ep
    GROUP BY ep.menu_key;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_menu_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_effective_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_merged_permissions TO authenticated;