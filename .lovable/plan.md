

# Force Re-Login sau khi Rotate JWT Keys

## Vấn đề
Revoke JWT key cũ không force logout user đã đăng nhập vì Supabase auto-refresh token bằng key mới (66B1D5CD). Cần cơ chế buộc tất cả user đăng nhập lại.

## Giải pháp: App-level Force Re-Auth

Thêm một "auth version" check vào app. Khi admin muốn force logout toàn bộ, chỉ cần tăng version.

### Cách hoạt động
1. Lưu một hằng số `AUTH_VERSION` trong code (ví dụ: `"2026-03-17"`)
2. Khi user đăng nhập thành công, lưu version vào `localStorage`
3. Mỗi lần app load, so sánh version trong localStorage vs code
4. Nếu không khớp → tự động `signOut()` và redirect về `/login`

### Files cần sửa

**`src/hooks/useAuth.ts`**
- Thêm hằng số `AUTH_VERSION = "2026-03-17"`
- Trong `useEffect` khởi tạo session: check `localStorage.getItem("auth_version")`
- Nếu version cũ hoặc không có → gọi `supabase.auth.signOut()`, xóa localStorage, redirect `/login`
- Khi login thành công → `localStorage.setItem("auth_version", AUTH_VERSION)`

### Kết quả
- Tất cả user hiện tại sẽ bị force logout ngay lập tức khi F5
- Sau khi đăng nhập lại, session mới dùng key mới 100%
- Về sau muốn force logout toàn bộ, chỉ cần đổi giá trị `AUTH_VERSION`

### Effort
- 1 file edit (`useAuth.ts`), ~15 dòng code
- Không cần migration, không cần edge function

