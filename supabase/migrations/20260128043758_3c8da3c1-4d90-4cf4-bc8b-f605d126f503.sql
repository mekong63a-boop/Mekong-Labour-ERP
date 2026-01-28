-- Tạo bảng department_menu_permissions nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.department_menu_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department text NOT NULL,
    menu_key text NOT NULL REFERENCES public.menus(key) ON DELETE CASCADE,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    assigned_by uuid,
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(department, menu_key)
);

-- Enable RLS
ALTER TABLE public.department_menu_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage department permissions"
ON public.department_menu_permissions
FOR ALL
USING (public.is_admin_check(auth.uid()))
WITH CHECK (public.is_admin_check(auth.uid()));

CREATE POLICY "Users can view department permissions"
ON public.department_menu_permissions
FOR SELECT
USING (true);

-- Function: Lấy quyền menu của phòng ban
CREATE OR REPLACE FUNCTION public.get_department_menu_permissions(_department text)
RETURNS TABLE (
    id uuid,
    department text,
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
BEGIN
    RETURN QUERY
    SELECT 
        dmp.id,
        dmp.department,
        dmp.menu_key,
        COALESCE(dmp.can_view, false),
        COALESCE(dmp.can_create, false),
        COALESCE(dmp.can_update, false),
        COALESCE(dmp.can_delete, false)
    FROM public.department_menu_permissions dmp
    WHERE dmp.department = _department;
END;
$$;

-- Function: Lưu quyền menu của phòng ban (xóa cũ + thêm mới)
CREATE OR REPLACE FUNCTION public.save_department_menu_permissions(
    _department text,
    _permissions jsonb,
    _assigned_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Xóa quyền cũ
    DELETE FROM public.department_menu_permissions
    WHERE department = _department;
    
    -- Thêm quyền mới
    INSERT INTO public.department_menu_permissions (department, menu_key, can_view, can_create, can_update, can_delete, assigned_by)
    SELECT 
        _department,
        (p->>'menu_key')::text,
        COALESCE((p->>'can_view')::boolean, false),
        COALESCE((p->>'can_create')::boolean, false),
        COALESCE((p->>'can_update')::boolean, false),
        COALESCE((p->>'can_delete')::boolean, false),
        _assigned_by
    FROM jsonb_array_elements(_permissions) AS p
    WHERE (p->>'can_view')::boolean = true;
END;
$$;

-- Update has_menu_permission để check cả department permissions
CREATE OR REPLACE FUNCTION public.has_menu_permission(_user_id uuid, _menu_key text, _permission text DEFAULT 'view')
RETURNS boolean
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
    SELECT EXISTS (
        SELECT 1
        FROM public.department_members dm
        JOIN public.department_menu_permissions dmp ON dm.department = dmp.department
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

-- Update get_user_effective_permissions
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(_user_id uuid)
RETURNS TABLE(menu_key text, can_view boolean, can_create boolean, can_update boolean, can_delete boolean, source text)
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

-- Update get_user_merged_permissions
CREATE OR REPLACE FUNCTION public.get_user_merged_permissions(_user_id uuid)
RETURNS TABLE(menu_key text, can_view boolean, can_create boolean, can_update boolean, can_delete boolean)
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