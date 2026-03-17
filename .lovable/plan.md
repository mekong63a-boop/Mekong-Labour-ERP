

# Đánh giá các vấn đề nghiêm trọng ảnh hưởng dài hạn (40,000+ records, 100+ users)

## Kết quả khám phá

Sau khi phân tích codebase, security scan, console logs, và Supabase linter, tôi xác định được **3 nhóm vấn đề** theo mức độ nghiêm trọng:

---

## 1. BẢO MẬT (CRITICAL - Cần xử lý ngay)

### 1a. Leo thang đặc quyền (Privilege Escalation) trên bảng `user_roles`
- **Mức độ: ERROR** - Bất kỳ admin thường nào cũng có thể tự nâng lên `is_primary_admin = true` và hạ cấp Primary Admin hiện tại.
- **Nguyên nhân**: Policy `user_roles_insert` chỉ check `is_admin()` mà không giới hạn giá trị `is_primary_admin` khi INSERT. Policy `user_roles_update` cho phép admin thường sửa row của Primary Admin.
- **Sửa**: Thắt chặt INSERT policy thêm `WITH CHECK: (is_primary_admin(auth.uid()) OR (is_primary_admin IS NOT TRUE))`. UPDATE policy thay `USING: is_admin()` bằng `USING: is_primary_admin()` cho các row có `is_primary_admin = true`.

### 1b. `department_menu_permissions` SELECT cho public (không cần đăng nhập)
- **Mức độ: WARN** - Bất kỳ ai cũng đọc được cấu trúc phân quyền nội bộ.
- **Sửa**: Đổi policy sang `TO authenticated`.

### 1c. `login_attempts` INSERT không giới hạn
- **Mức độ: WARN** - Authenticated user có thể tạo login_attempts giả cho identifier bất kỳ, gây lockout tài khoản người khác.
- **Sửa**: Thêm `WITH CHECK (identifier = auth.email())` hoặc chuyển sang dùng RPC.

### 1d. Edge Function `export-trainee-pdf` vẫn hardcode legacy key
- Security scan báo hardcoded credentials nhưng kiểm tra thực tế thì file đã dùng `Deno.env.get()`. Scan kết quả cũ, **không cần sửa**.

---

## 2. HIỆU SUẤT (MEDIUM - Ảnh hưởng khi scale)

### 2a. Session Heartbeat gọi API ngoài mỗi 60 giây
- `useSessionHeartbeat` → `fetchPublicIp()` gọi `api.ipify.org` mỗi 60s cho **mỗi user**.
- 100 users = **100 requests/phút** tới ipify + 100 upserts/phút tới `user_sessions`.
- **Sửa**: Cache IP trong sessionStorage (IP hiếm khi thay đổi trong 1 session). Hoặc chỉ gọi IP lần đầu.

### 2b. PaginationControls thiếu `React.forwardRef`
- Console warning liên tục: "Function components cannot be given refs".
- Không crash nhưng gây noise trong logs và có thể ảnh hưởng render performance.
- **Sửa**: Wrap `PaginationControls` bằng `React.forwardRef`.

---

## 3. ỔN ĐỊNH DÀI HẠN (LOW - Nên xử lý sớm)

### 3a. Realtime subscription "mega-channel"
- `useSystemRealtime` subscribe **14 bảng** trong 1 channel duy nhất. Khi 100 users đồng thời, mỗi thay đổi broadcast tới tất cả.
- Hiện tại debounce 500ms đã giúp giảm tải, nhưng nên theo dõi khi vượt 50+ users.

### 3b. PII lưu plaintext
- Đã ghi nhận trong memory. Cần lộ trình `pgsodium` column-level encryption cho CCCD, passport, SĐT.

---

## Kế hoạch xử lý đề xuất (ưu tiên theo mức độ)

| Ưu tiên | Vấn đề | Effort |
|---------|--------|--------|
| P0 | Fix `user_roles` privilege escalation | 1 migration |
| P0 | Fix `department_menu_permissions` public SELECT | 1 migration |
| P0 | Fix `login_attempts` unrestricted INSERT | 1 migration |
| P1 | Cache IP trong sessionHeartbeat | 1 file edit |
| P1 | Fix PaginationControls forwardRef | 1 file edit |
| P2 | Theo dõi realtime load | Monitoring |
| P2 | Lộ trình PII encryption | Planning |

Tổng cộng: **3 SQL migrations** + **2 file edits** cho các vấn đề P0-P1. Bạn muốn tôi xử lý nhóm nào trước?

