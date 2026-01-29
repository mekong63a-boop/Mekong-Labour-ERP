
-- Cập nhật function can_view_trainee_pii để bao gồm nhân viên cấp cao (is_senior_staff)
CREATE OR REPLACE FUNCTION public.can_view_trainee_pii()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_primary_admin_check(auth.uid())
    OR public.has_menu_permission(auth.uid(), 'trainees', 'update')
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND is_senior_staff = true
    );
$$;

-- Thêm comment giải thích
COMMENT ON FUNCTION public.can_view_trainee_pii() IS 
'Kiểm tra quyền xem PII (thông tin nhạy cảm) của thực tập sinh.
- Admin chính (is_primary_admin): Luôn có quyền
- Người có quyền update trainees: Có quyền
- Nhân viên cấp cao (is_senior_staff): Có quyền xem như admin';
