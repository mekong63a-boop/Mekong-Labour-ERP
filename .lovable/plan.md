

## Đánh giá bảo mật hệ thống Mekong Labour ERP

### Mức bảo mật hiện tại: **Tốt (8/10)** — có 2 vấn đề cần sửa

---

### Những gì đã làm tốt

| Lớp bảo mật | Trạng thái |
|---|---|
| RLS trên toàn bộ bảng nghiệp vụ | ✅ Đầy đủ, dùng `can_view/insert/update/delete` |
| 74 hàm SECURITY DEFINER đều có `search_path = public` | ✅ |
| PII masking (UI + view `trainees_masked`) | ✅ |
| Edge Functions: CORS allowlist + JWT validation thủ công | ✅ |
| Login rate limiting (5 lần/15 phút) | ✅ |
| Primary Admin protection trigger | ✅ |
| Publishable Key thế hệ mới (`sb_publishable_...`) | ✅ |
| Legacy JWT keys đã vô hiệu hóa | ✅ |
| Private storage + Signed URLs cho ảnh | ✅ |
| Leaked Password Protection đã bật | ✅ |
| Views dùng `security_invoker = true` | ✅ |
| Audit logging cho thay đổi nhạy cảm | ✅ |
| Edge Functions dùng shared auth utility | ✅ |

---

### 2 vấn đề cần sửa ngay

#### 1. CRITICAL — Lỗ hổng leo thang đặc quyền qua `is_primary_admin_check`

**Vấn đề**: Hàm `is_primary_admin_check` chỉ kiểm tra `is_primary_admin = true` mà KHÔNG yêu cầu `role = 'admin'`. Nếu Primary Admin vô tình gán `is_primary_admin = true` cho user có `role = 'staff'`, user đó sẽ bypass toàn bộ hệ thống phân quyền.

**Sửa**:
- Cập nhật hàm `is_primary_admin_check` thêm điều kiện `AND role = 'admin'`
- Thêm CHECK constraint trên bảng `user_roles`: `is_primary_admin = true` chỉ khi `role = 'admin'`

#### 2. WARN — Thư viện xlsx có lỗ hổng Prototype Pollution + ReDoS

**Vấn đề**: Package `xlsx@0.20.3` vẫn bị đánh dấu có lỗ hổng high severity (Prototype Pollution, ReDoS).

**Sửa**: Đây là phiên bản mới nhất từ SheetJS. Lỗ hổng này ảnh hưởng chủ yếu khi parse file từ nguồn không tin cậy. Giảm thiểu bằng cách validate file trước khi parse (kiểm tra kích thước, định dạng). Không có bản vá nào khác.

---

### Lộ trình nâng bảo mật lên 10/10

| # | Hành động | Mức độ | Phạm vi |
|---|-----------|--------|---------|
| 1 | Sửa `is_primary_admin_check` + thêm CHECK constraint | 🔴 Critical | Migration SQL |
| 2 | Mã hóa cột PII (CCCD, hộ chiếu, SĐT) bằng `pgsodium` | 🟡 Quan trọng | Cần thực hiện trên Supabase Dashboard |
| 3 | Bật MFA (Multi-Factor Authentication) cho Admin | 🟡 Quan trọng | Supabase Auth settings |
| 4 | Input validation cho file xlsx trước khi parse | 🟢 Tùy chọn | Frontend code |

---

### Kế hoạch thực hiện (những gì Lovable có thể làm ngay)

**Migration SQL**:
```sql
-- 1. Fix is_primary_admin_check
CREATE OR REPLACE FUNCTION public.is_primary_admin_check(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND is_primary_admin = true
      AND role = 'admin'
  )
$$;

-- 2. Prevent is_primary_admin on non-admin roles
ALTER TABLE public.user_roles
ADD CONSTRAINT chk_primary_admin_requires_admin
CHECK (is_primary_admin = false OR is_primary_admin IS NULL OR role = 'admin');
```

**Về Supabase Dashboard** (cần bạn tự thực hiện):
- **Mã hóa cột**: Bật Vault/pgsodium cho các cột CCCD, passport, phone — đây là tính năng cấp database, không thể thực hiện qua Lovable
- **MFA**: Vào Authentication > Settings > bật MFA cho tài khoản Admin

