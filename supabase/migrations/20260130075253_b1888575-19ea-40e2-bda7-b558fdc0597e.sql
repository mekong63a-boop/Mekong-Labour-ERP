
-- Tạo RPC function để lấy danh sách user đã xác nhận email
-- SYSTEM RULE: Chỉ user đã confirm email mới xuất hiện trong hệ thống phân quyền

CREATE OR REPLACE FUNCTION public.get_confirmed_user_ids()
RETURNS TABLE(user_id uuid) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id AS user_id
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_confirmed_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmed_user_ids() TO anon;

-- Thêm comment để ghi chú rule
COMMENT ON FUNCTION public.get_confirmed_user_ids() IS 
'Chỉ trả về user_id của những user đã xác nhận email. 
Dùng để lọc danh sách user trong hệ thống phân quyền.
LOCKED: 2026-01-30 - Không thay đổi logic này.';
