-- Cập nhật function has_menu_permission để kiểm tra cả user_menu_permissions VÀ department_menu_permissions
-- SINGLE SOURCE OF TRUTH: Một function duy nhất xử lý tất cả quyền menu

CREATE OR REPLACE FUNCTION public.has_menu_permission(_user_id uuid, _menu_key text, _action text DEFAULT 'view'::text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Chỉ Primary Admin bypass tất cả
  IF public.is_primary_admin_check(_user_id) THEN
    RETURN true;
  END IF;
  
  -- Kiểm tra quyền trực tiếp của user từ user_menu_permissions
  IF EXISTS (
    SELECT 1
    FROM public.user_menu_permissions ump
    WHERE ump.user_id = _user_id
      AND ump.menu_key = _menu_key
      AND (
        CASE _action
          WHEN 'view' THEN ump.can_view = true
          WHEN 'create' THEN ump.can_create = true
          WHEN 'update' THEN ump.can_update = true
          WHEN 'delete' THEN ump.can_delete = true
          ELSE false
        END
      )
  ) THEN
    RETURN true;
  END IF;
  
  -- Kiểm tra quyền thông qua department_menu_permissions (user thuộc phòng ban nào có quyền)
  RETURN EXISTS (
    SELECT 1
    FROM public.department_members dm
    JOIN public.department_menu_permissions dmp ON dm.department = dmp.department
    WHERE dm.user_id = _user_id
      AND dmp.menu_key = _menu_key
      AND (
        CASE _action
          WHEN 'view' THEN dmp.can_view = true
          WHEN 'create' THEN dmp.can_create = true
          WHEN 'update' THEN dmp.can_update = true
          WHEN 'delete' THEN dmp.can_delete = true
          ELSE false
        END
      )
  );
END;
$function$;

-- Xóa các policy SELECT cũ dùng is_manager_or_higher (vi phạm SINGLE SOURCE)
-- Giữ lại chỉ policy dựa trên can_view('internal-union')
DROP POLICY IF EXISTS "Manager+ only view union_members" ON public.union_members;
DROP POLICY IF EXISTS "union_members_select" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ only view union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_select" ON public.union_transactions;

-- Xóa các policy INSERT/UPDATE/DELETE cũ dùng is_manager_or_higher
DROP POLICY IF EXISTS "Manager+ only insert union_members" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ only update union_members" ON public.union_members;
DROP POLICY IF EXISTS "Manager+ only delete union_members" ON public.union_members;
DROP POLICY IF EXISTS "union_members_insert" ON public.union_members;
DROP POLICY IF EXISTS "union_members_update" ON public.union_members;
DROP POLICY IF EXISTS "union_members_delete" ON public.union_members;

DROP POLICY IF EXISTS "Manager+ only insert union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Manager+ only update union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "Manager+ only delete union_transactions" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_insert" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_update" ON public.union_transactions;
DROP POLICY IF EXISTS "union_transactions_delete" ON public.union_transactions;