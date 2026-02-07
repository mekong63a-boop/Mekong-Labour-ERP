
## Bảo mật Supabase: Fix Security Definer Views + Search Path + Leaked Password

### Tóm tắt vấn đề hiện tại
Từ security scan, dự án có 3 vấn đề chính cần xử lý:

1. **SUPA_security_definer_view (ERROR)**: Các views sử dụng SECURITY DEFINER có thể bypass RLS policies
2. **SUPA_function_search_path_mutable (WARN)**: Một số functions thiếu `SET search_path = public`, dễ bị injection attacks
3. **SUPA_auth_leaked_password_protection (WARN)**: Leaked Password Protection chưa được bật trong Supabase Auth Settings

---

### 1. Fix SECURITY DEFINER Views (Chuyển sang SECURITY INVOKER)

**Vấn đề:** 
- Dashboard views hiện sử dụng mặc định (implicit SECURITY DEFINER từ cách tạo cũ)
- SECURITY DEFINER có nghĩa view chạy với quyền của người tạo (thường là admin), bypass RLS của user thực tế

**Danh sách 11 Dashboard Views cần fix:**
```
1. dashboard_trainee_kpis
2. dashboard_trainee_by_stage
3. dashboard_trainee_by_status
4. dashboard_trainee_by_type
5. dashboard_trainee_monthly
6. dashboard_trainee_by_source
7. dashboard_trainee_by_birthplace
8. dashboard_trainee_by_gender
9. dashboard_trainee_departures_monthly
10. dashboard_trainee_passed_monthly
11. dashboard_monthly_combined
12. dashboard_monthly_passed
13. dashboard_trainee_by_company (và các view khác liên quan)
```

**Giải pháp:**
- Chuyển tất cả sang `security_invoker = true` (hoặc `security_invoker = on`)
- Các views này query từ bảng đã có RLS policies → user chỉ thấy dữ liệu theo quyền của họ → tự động bảo vệ

**SQL Migration Pattern:**
```sql
DROP VIEW IF EXISTS public.dashboard_trainee_kpis;
CREATE OR REPLACE VIEW public.dashboard_trainee_kpis
WITH (security_invoker = true) AS
SELECT ... (nội dung view hiện tại)
```

**Tác động:** ✅ No Breaking Changes
- Với `security_invoker = true`, view sẽ áp dụng RLS policies của user đó
- Kết quả không thay đổi với user có quyền xem hết dữ liệu (admin)
- Với user restricted, view sẽ tự động filter dữ liệu theo quyền → thêm security layer

---

### 2. Fix Function Search Path (Thêm SET search_path = public)

**Vấn đề:**
Một số functions (trigger functions, helper functions) thiếu `SET search_path = public`:
```
- ensure_single_manager_per_department() - dòng 83
- mask_phone, mask_cccd, mask_passport, mask_email - trigger functions
- get_trainee_full_profile - đã có, OK
- sync_trainee_status_from_workflow - dòng 36, OK
```

**Giải pháp:**
Thêm `SET search_path = public` vào các function chưa có:
```sql
CREATE OR REPLACE FUNCTION public.ensure_single_manager_per_department()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public  -- ← ADD THIS
AS $$
  ...
$$;
```

**Tác động:** ✅ No Breaking Changes
- Chỉ là cài đặt bảo mật, không thay đổi logic
- Ngăn chặn search path injection attacks (attacker không thể tạo schema/function khác để hijack)

---

### 3. Bật Leaked Password Protection (Thủ công trên Supabase Dashboard)

**Vấn đề:**
Supabase Auth Settings chưa bật kiểm tra "leaked passwords" từ Have I Been Pwned database.

**Giải pháp (thủ công):**
Vào Supabase Dashboard → Authentication → Settings → Tìm "Leaked Password Protection" → Bật nó

**Tác động:** ✅ Bảo mật tương lai
- Nếu user đặt password đã bị leak, Supabase sẽ từ chối
- Thêm 1 layer bảo vệ dữ liệu tài khoản user

---

### Plan Triển khai (Trình tự)

#### **PHASE 1: Tạo SQL Migration cho Dashboard Views** (10 min)
- Tạo migration file `20260207_fix_security_views.sql`
- Chứa DROP + CREATE 11-15 dashboard views với `security_invoker = true`
- Tuân thủ thứ tự dependency (views có FK phải tạo sau)

#### **PHASE 2: Tạo SQL Migration cho Function Search Paths** (5 min)
- Tạo migration file `20260207_fix_function_search_paths.sql`
- Thêm `SET search_path = public` cho các functions còn thiếu:
  - ensure_single_manager_per_department()
  - trigger functions (mask_phone, mask_cccd, v.v.)
  - Bất kỳ SECURITY DEFINER function nào thiếu

#### **PHASE 3: Bật Leaked Password Protection** (2 min, thủ công)
- User vào Supabase Dashboard
- Authentication → Settings → Leaked Password Protection → Bật
- Hoặc dùng Supabase CLI: `supabase env list` → copy project URL → vào dashboard web

---

### Tiêu chí nghiệm thu (QA)

1. **Security Definer Views:**
   - Chạy security scan lại → không có "Security Definer View" errors
   - Vào Dashboard → biểu đồ vẫn hiển thị đúng
   - Test role-based filtering: User staff chỉ thấy dữ liệu phòng ban của họ

2. **Function Search Paths:**
   - Security scan → không có "Function Search Path Mutable" warnings
   - Trigger `ensure_single_manager_per_department` vẫn hoạt động (chỉ 1 manager per dept)

3. **Leaked Password Protection:**
   - Supabase Dashboard → Authentication → Settings → Xác nhận "Leaked Password Protection: ON"

---

### Technical Details (Nếu cần tham khảo)

**Mô phỏng logic:**
```
SECURITY DEFINER (cũ):
  SELECT * FROM dashboard_trainee_kpis
  → Query chạy với quyền của creator (admin)
  → Trả về TẤT CẢ dữ liệu (không filter theo user)

SECURITY INVOKER (mới):
  SELECT * FROM dashboard_trainee_kpis
  → Query chạy với quyền của người query (staff/admin)
  → RLS policies tự động lọc:
     - Admin → thấy tất cả
     - Staff phòng A → chỉ thấy học viên phòng A
```

**Ví dụ SET search_path:**
```sql
-- Trước (không bảo vệ):
CREATE OR REPLACE FUNCTION public.ensure_single_manager_per_department()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
  DELETE FROM public.department_members WHERE ...
  -- Attacker tạo public.department_members ở schema khác → bị hack
$$;

-- Sau (bảo vệ):
CREATE OR REPLACE FUNCTION public.ensure_single_manager_per_department()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.department_members WHERE ...
  -- Attacker tạo schema/function khác → bị ignore (search_path fixed = public)
$$;
```

---

### Files cần sửa (Tóm tắt)

| Phase | Loại | Chi tiết |
|-------|------|---------|
| **Phase 1** | SQL Migration | `supabase/migrations/20260207_*.sql` - Tạo views với `security_invoker = true` |
| **Phase 2** | SQL Migration | `supabase/migrations/20260207_*.sql` - Thêm `SET search_path` vào functions |
| **Phase 3** | Thủ công | Supabase Dashboard → Auth Settings → Bật Leaked Password Protection |

---

### Dự kiến rủi ro & giảm nhẹ

| Rủi ro | Khả năng | Giảm nhẹ |
|--------|----------|---------|
| Dashboard hiển thị sai sau fix security_invoker | **Thấp** | RLS policies đã được kiểm tra → logic không đổi |
| Trigger functions fail nếu thêm SET search_path | **Rất thấp** | Chỉ là cài đặt, không thay đổi logic function |
| Performance degrade | **Không** | security_invoker không ảnh hưởng hiệu suất |
| User không thể login nếu bật Leaked Password Protection | **Rất thấp** | Chỉ ảnh hưởng user có password bị leak trước đó |

