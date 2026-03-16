

## Kế hoạch sửa 3 lỗ hổng bảo mật

### 1. CRITICAL: Chặn leo thang đặc quyền Primary Admin

Sửa policy `user_roles_insert` trên bảng `user_roles`:

```sql
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    AND (is_primary_admin IS NOT TRUE OR public.is_primary_admin(auth.uid()))
  );
```

Chỉ Primary Admin hiện tại mới có thể tạo row với `is_primary_admin = true`.

### 2. WARN: Sửa policy "Always True" trên `login_attempts`

Policy `allow_login_attempt_logging` hiện dùng `WITH CHECK (true)`. Vì login attempts được ghi qua `record_login_attempt()` (SECURITY DEFINER), nên có thể thắt chặt hơn:

```sql
DROP POLICY IF EXISTS "allow_login_attempt_logging" ON public.login_attempts;
CREATE POLICY "allow_login_attempt_logging" ON public.login_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 3. WARN: Chặn unauthenticated đọc permission matrix

Chuyển SELECT policy trên `department_menu_permissions` từ `public` sang `authenticated`:

```sql
DROP POLICY IF EXISTS "Users can view department permissions" ON public.department_menu_permissions;
CREATE POLICY "Authenticated users can view department permissions" ON public.department_menu_permissions
  FOR SELECT TO authenticated
  USING (true);
```

### Tổng kết

Một migration duy nhất sửa cả 3 lỗ hổng, không ảnh hưởng chức năng hiện tại.

