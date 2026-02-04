# 📋 TÀI LIỆU HỆ THỐNG - MEKONG LABOUR ERP

> **Phiên bản:** Export 04/02/2026  
> **Lưu ý:** Tài liệu này chỉ liệt kê, không suy diễn.

---

## 1. DANH SÁCH MENU

| Menu Key | Label | Path | Parent | Mục tiêu nghiệp vụ | Bảng đọc | Bảng ghi | Hành động ghi | Cột chính | Điều kiện lọc |
|----------|-------|------|--------|-------------------|----------|----------|--------------|-----------|---------------|
| `dashboard` | Tổng quan | `/` | - | Xem thống kê tổng hợp | `dashboard_trainee_kpis`, `dashboard_monthly_*`, `dashboard_trainee_by_*` | - | - | - | Theo năm |
| `trainees` | Học viên | `/trainees` | - | Quản lý hồ sơ học viên | `trainees`, `trainees_with_workflow` | `trainees`, `trainee_workflow` | INSERT/UPDATE/DELETE | `full_name`, `trainee_code`, `progression_stage` | `progression_stage`, `gender`, `trainee_type`, `class_id` |
| `orders` | Đơn hàng | `/orders` | - | Quản lý đơn tuyển dụng | `orders`, `companies`, `unions`, `job_categories` | `orders`, `trainees` | INSERT/UPDATE/DELETE | `code`, `status`, `quantity` | `status`, `company_id`, `union_id` |
| `partners` | Đối tác | `/partners` | - | Quản lý công ty/nghiệp đoàn/ngành nghề | `companies`, `unions`, `job_categories` | `companies`, `unions`, `job_categories` | INSERT/UPDATE/DELETE | `name`, `code`, `status` | `status`, `country` |
| `internal_ops` | Nghiệp vụ nội bộ | `#` | - | Menu cha chứa submenu | - | - | - | - | - |
| `education` | Đào tạo | `/education` | `internal_ops` | Quản lý lớp học/điểm danh/điểm số | `classes`, `teachers`, `attendance`, `test_scores`, `trainee_reviews` | `classes`, `teachers`, `attendance`, `test_scores`, `trainee_reviews`, `enrollment_history` | INSERT/UPDATE/DELETE | `class_id`, `score`, `status` | `class_id`, `date`, `status` |
| `dormitory` | Quản lý KTX | `/dormitory` | `internal_ops` | Quản lý ký túc xá | `dormitories`, `dormitory_residents`, `dormitories_with_occupancy` | `dormitories`, `dormitory_residents` | INSERT/UPDATE/DELETE | `room_number`, `check_in_date`, `status` | `dormitory_id`, `status` |
| `legal` | Tình trạng hồ sơ | `/legal` | `internal_ops` | Theo dõi hồ sơ pháp lý | `trainees` | `trainees` | UPDATE | `document_status`, `passport_*`, `cccd_*`, `visa_date`, `coe_date` | `document_status` |
| `post_departure` | Sau xuất cảnh | `/post-departure` | - | Theo dõi sau xuất cảnh | `trainees` (đã xuất cảnh) | `trainees` | UPDATE | `current_situation`, `return_date`, `early_return_*` | `progression_stage = 'Xuất cảnh'` hoặc sau đó |
| `handbook` | Cẩm nang tư vấn | `/handbook` | - | Quản lý sổ tay hướng dẫn | `handbook_entries` | `handbook_entries` | INSERT/UPDATE/DELETE | `title`, `content`, `category` | `category`, `is_published` |
| `violations` | Blacklist | `/violations` | - | Quản lý vi phạm/blacklist | `trainee_reviews` (is_blacklisted=true) | `trainee_reviews` | INSERT/UPDATE/DELETE | `is_blacklisted`, `blacklist_reason` | `is_blacklisted = true` |
| `reports` | Báo cáo | `/reports` | - | Xuất báo cáo/hồ sơ | `trainees` + tất cả bảng liên quan | - | - | - | Theo trainee_id |
| `glossary` | Từ điển chuyên ngành | `/glossary` | - | Quản lý danh mục | `katakana_names`, `vocabulary`, `hobbies`, `religions`, `passport_places`, `cccd_places`, `referral_sources`, `policy_categories` | Tất cả bảng trên | INSERT/UPDATE/DELETE | `name`, `vietnamese_name`, `katakana` | - |
| `internal_union` | Công đoàn nội bộ | `/internal-union` | - | Quản lý công đoàn nội bộ | `union_members`, `union_transactions` | `union_members`, `union_transactions` | INSERT/UPDATE/DELETE | `member_code`, `amount`, `transaction_type` | `status`, `transaction_type` |
| `admin` | Quản trị hệ thống | `/admin` | - | Quản lý user/phòng ban/quyền | `profiles`, `user_roles`, `departments`, `department_members`, `menus`, `user_menu_permissions`, `department_menu_permissions`, `user_sessions`, `audit_logs` | Tất cả bảng trên | INSERT/UPDATE/DELETE | `role`, `can_view`, `can_create`, `can_update`, `can_delete` | `department`, `role` |

---

## 2. TRAINEE (HỌC VIÊN) LÀ NGUỒN GỐC

### 2.1. Record gốc

| Thuộc tính | Giá trị |
|-----------|---------|
| **Bảng gốc** | `public.trainees` |
| **Primary Key** | `id` (UUID) |
| **Unique Key** | `trainee_code` |
| **Nguyên tắc** | 1 học viên = 1 record trong `trainees` |

### 2.2. Bảng liên quan 1-N với `trainee_id`

| Bảng | Mô tả | ON DELETE |
|------|-------|-----------|
| `education_history` | Lịch sử học vấn | CASCADE |
| `work_history` | Lịch sử làm việc | CASCADE |
| `family_members` | Thành viên gia đình | CASCADE |
| `japan_relatives` | Người thân tại Nhật | CASCADE |
| `interview_history` | Lịch sử phỏng vấn | CASCADE |
| `trainee_workflow` | Trạng thái workflow (1-1) | CASCADE |
| `trainee_workflow_history` | Lịch sử chuyển trạng thái | CASCADE |
| `attendance` | Điểm danh | CASCADE |
| `test_scores` | Điểm thi | CASCADE |
| `trainee_reviews` | Đánh giá/Blacklist | CASCADE |
| `enrollment_history` | Lịch sử chuyển lớp | CASCADE |
| `dormitory_residents` | Ở KTX | CASCADE |

### 2.3. Trạng thái học viên (ĐÃ CHUẨN HÓA)

> **⚠️ QUAN TRỌNG:** Kể từ 04/02/2026, hệ thống áp dụng mô hình **"1 học viên = 1 luồng trạng thái"**.
> 
> - **Nguồn duy nhất:** `trainee_workflow.current_stage`
> - **Các cột `trainees.simple_status` và `trainees.progression_stage`:** Tự động đồng bộ qua trigger, KHÔNG nhập tay
> - **RPC duy nhất:** `rpc_transition_trainee_stage(p_trainee_id, p_to_stage, p_sub_status, p_reason)`

#### Cột CHÍNH: `trainee_workflow.current_stage` (ENUM `trainee_workflow_stage`)

| Giá trị DB | Mô tả | Mapping → simple_status | Mapping → progression_stage |
|-----------|-------|------------------------|----------------------------|
| `recruited` | Đã tuyển dụng | Đang học | Chưa đậu |
| `trained` | Đang đào tạo | Đang học | Chưa đậu |
| `dormitory` | Đang ở KTX | Đang học | Chưa đậu |
| `visa_processing` | Đang xử lý visa | Đang học | Nộp hồ sơ |
| `ready_to_depart` | Sẵn sàng xuất cảnh | Đang học | COE |
| `departed` | Đã xuất cảnh | Đã xuất cảnh | Xuất cảnh |
| `post_departure` | Sau xuất cảnh | Đã xuất cảnh | Đang làm việc |
| `archived` | Lưu trữ | Lưu trữ | Hoàn thành hợp đồng |

#### Cột PHỤ (readonly): `trainees.progression_stage` (ENUM `progression_stage`)

| Giá trị DB | Hiển thị UI | Ghi chú |
|-----------|-------------|---------|
| `Chưa đậu` | Chưa đậu | Tự động đồng bộ |
| `Đậu phỏng vấn` | Đậu phỏng vấn | Tự động đồng bộ |
| `Nộp hồ sơ` | Nộp hồ sơ | Tự động đồng bộ |
| `OTIT` | OTIT | Tự động đồng bộ |
| `Nyukan` | Nyukan | Tự động đồng bộ |
| `COE` | COE | Tự động đồng bộ |
| `Xuất cảnh` | Xuất cảnh | Tự động đồng bộ |
| `Đang làm việc` | Đang làm việc | Tự động đồng bộ |
| `Hoàn thành hợp đồng` | Hoàn thành HĐ/ về nước | Tự động đồng bộ |
| `Bỏ trốn` | Bỏ trốn | Tự động đồng bộ |
| `Về trước hạn` | Về trước hạn | Tự động đồng bộ |

#### Cột PHỤ (readonly): `trainees.simple_status` (ENUM `simple_status`)

| Giá trị DB | Mô tả | Ghi chú |
|-----------|-------|---------|
| `Đang học` | Đang trong chương trình | Tự động đồng bộ |
| `Đã xuất cảnh` | Đã rời Việt Nam | Tự động đồng bộ |
| `Hoàn thành` | Hoàn thành hợp đồng | Tự động đồng bộ |
| `Về nước sớm` | Về trước hạn | Tự động đồng bộ |
| `Bỏ trốn` | Bỏ trốn | Tự động đồng bộ |
| `Lưu trữ` | Lưu trữ | Tự động đồng bộ |

#### Sử dụng RPC để chuyển trạng thái

```sql
-- Ví dụ: Chuyển học viên sang giai đoạn "departed"
SELECT rpc_transition_trainee_stage(
  'trainee-uuid',
  'departed',        -- to_stage
  NULL,              -- sub_status (optional)
  'Xuất cảnh ngày 01/02/2026'  -- reason (optional)
);
```

**Kết quả:**
- Update `trainee_workflow.current_stage` = 'departed'
- Insert record vào `trainee_workflow_history`
- Trigger tự động sync `trainees.simple_status` = 'Đã xuất cảnh'
- Trigger tự động sync `trainees.progression_stage` = 'Xuất cảnh'

---

## 3. LUỒNG END-TO-END

### 3.1. Đăng ký học viên

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Bấm nút "Thêm học viên" tại `/trainees` |
| **Bảng ghi** | `trainees` |
| **Cột cập nhật** | `full_name`, `trainee_code`, `birth_date`, `phone`, `registration_date`, `progression_stage = 'Chưa đậu'` |
| **History/Audit** | `audit_logs` (INSERT action) |

### 3.2. Nhập lớp học

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Gán `class_id` trong form học viên hoặc tại `/education/classes/:id/students` |
| **Bảng ghi** | `trainees`, `enrollment_history` |
| **Cột cập nhật** | `trainees.class_id`, `trainees.enrollment_status` |
| **History/Audit** | `enrollment_history` (action_type = 'enroll'), `audit_logs` |

### 3.3. Điểm danh / Đào tạo

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Điểm danh tại `/education/attendance`, nhập điểm tại `/education/test-scores` |
| **Bảng ghi** | `attendance`, `test_scores` |
| **Cột cập nhật** | `attendance.status`, `test_scores.score`, `test_scores.evaluation` |
| **History/Audit** | Không có bảng history riêng |

### 3.4. Quản lý KTX

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Check-in tại `/dormitory` |
| **Bảng ghi** | `dormitory_residents` |
| **Cột cập nhật** | `dormitory_id`, `room_number`, `bed_number`, `check_in_date`, `status` |
| **History/Audit** | `from_dormitory_id`, `transfer_reason` khi chuyển KTX |

### 3.5. Phỏng vấn

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Gán đơn hàng hoặc cập nhật kết quả phỏng vấn |
| **Bảng ghi** | `trainees`, `interview_history` |
| **Cột cập nhật** | `trainees.interview_pass_date`, `trainees.receiving_company_id`, `trainees.union_id`, `trainees.job_category_id`, `trainees.progression_stage`, `trainees.interview_count` |
| **History/Audit** | `interview_history` (result, interview_date) |

### 3.6. Nộp hồ sơ / Xử lý visa

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Cập nhật trạng thái tại form chi tiết học viên |
| **Bảng ghi** | `trainees`, `trainee_workflow` |
| **Cột cập nhật** | `trainees.document_submission_date`, `trainees.document_status`, `trainees.otit_entry_date`, `trainees.nyukan_entry_date`, `trainees.coe_date`, `trainees.visa_date`, `trainees.progression_stage` |
| **History/Audit** | `trainee_workflow_history`, `audit_logs` |

### 3.7. Xuất cảnh

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Cập nhật `departure_date` |
| **Bảng ghi** | `trainees`, `trainee_workflow` |
| **Cột cập nhật** | `trainees.departure_date`, `trainees.entry_date`, `trainees.progression_stage = 'Xuất cảnh'`, `trainee_workflow.current_stage = 'departed'` |
| **History/Audit** | `trainee_workflow_history`, `audit_logs` |

### 3.8. Sau xuất cảnh

| Mục | Chi tiết |
|-----|----------|
| **Sự kiện** | Cập nhật tình trạng tại `/post-departure` |
| **Bảng ghi** | `trainees`, `trainee_workflow` |
| **Cột cập nhật** | `trainees.current_situation`, `trainees.return_date`, `trainees.expected_return_date`, `trainees.early_return_date`, `trainees.early_return_reason`, `trainees.absconded_date`, `trainees.progression_stage` |
| **History/Audit** | `trainee_workflow_history`, `audit_logs` |

---

## 4. QUYỀN TRUY CẬP

### 4.1. Roles trong hệ thống

| Role | Mô tả |
|------|-------|
| `admin` | Quản trị viên - có quyền quản lý user và phân quyền |
| `staff` | Nhân viên - quyền theo menu được cấp |

**Các cờ đặc biệt trong `user_roles`:**

| Cột | Mô tả |
|-----|-------|
| `is_primary_admin` | Admin chính - toàn quyền, không cần kiểm tra permission |
| `is_senior_staff` | Nhân viên cấp cao - được xem dữ liệu PII không bị mask |

### 4.2. Phân quyền theo Menu

Quyền được lưu tại:
- `user_menu_permissions` - quyền cá nhân
- `department_menu_permissions` - quyền phòng ban

| Cột | Mô tả |
|-----|-------|
| `can_view` | Được xem menu và dữ liệu |
| `can_create` | Được thêm mới |
| `can_update` | Được chỉnh sửa |
| `can_delete` | Được xóa |

### 4.3. Logic kiểm tra quyền

| Nơi gọi | Function/Hook |
|---------|--------------|
| `src/hooks/useMenuPermissions.ts` | `get_user_merged_permissions` (RPC) |
| `src/hooks/useCanEdit.ts` | `useCanEdit()` hook |
| `src/components/auth/MenuProtectedRoute.tsx` | Bảo vệ route theo menu |
| `src/components/auth/ProtectedRoute.tsx` | Bảo vệ route yêu cầu đăng nhập |

### 4.4. Ma trận quyền mặc định

| Menu | Primary Admin | Admin | Senior Staff | Staff |
|------|--------------|-------|--------------|-------|
| `dashboard` | ✅ Full | ✅ View | ✅ View | Theo cấp quyền |
| `trainees` | ✅ Full | ✅ Full | ✅ Full (PII visible) | Theo cấp quyền (PII masked) |
| `orders` | ✅ Full | ✅ Full | Theo cấp quyền | Theo cấp quyền |
| `partners` | ✅ Full | ✅ Full | Theo cấp quyền | Theo cấp quyền |
| `education` | ✅ Full | ✅ Full | Theo cấp quyền | Theo cấp quyền |
| `admin` | ✅ Full | ✅ Full | ❌ | ❌ |

---

## 5. DASHBOARD (TỔNG QUAN)

### 5.1. Danh sách chỉ số KPI

**View:** `dashboard_trainee_kpis`

| Chỉ số | Công thức / Cột nguồn |
|--------|----------------------|
| `total_trainees` | `COUNT(*) FROM trainees` |
| `total_male` | `COUNT(*) WHERE gender = 'Nam'` |
| `total_female` | `COUNT(*) WHERE gender = 'Nữ'` |
| `status_studying` | `COUNT(*) WHERE progression_stage IN ('Chưa đậu', 'Đậu phỏng vấn', 'Nộp hồ sơ', ...)` (chưa xuất cảnh) |
| `studying_male` | `status_studying WHERE gender = 'Nam'` |
| `studying_female` | `status_studying WHERE gender = 'Nữ'` |
| `departed_this_year` | `COUNT(*) WHERE EXTRACT(YEAR FROM departure_date) = EXTRACT(YEAR FROM CURRENT_DATE)` |
| `departed_this_month` | `COUNT(*) WHERE departure_date trong tháng hiện tại` |
| `departed_male` | `departed_this_year WHERE gender = 'Nam'` |
| `departed_female` | `departed_this_year WHERE gender = 'Nữ'` |
| `registered_this_month` | `COUNT(*) WHERE registration_date trong tháng hiện tại` |
| `registered_this_year` | `COUNT(*) WHERE EXTRACT(YEAR FROM registration_date) = năm hiện tại` |
| `stage_recruited` | `COUNT(*) WHERE progression_stage = 'Chưa đậu'` |
| `stage_visa_processing` | `COUNT(*) WHERE progression_stage IN ('Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa')` |
| `stage_ready_to_depart` | `COUNT(*) WHERE progression_stage = 'Xuất cảnh' AND departure_date IS NULL` |
| `stage_departed` | `COUNT(*) WHERE departure_date IS NOT NULL` |
| `stage_in_japan` | `COUNT(*) WHERE progression_stage = 'Đang làm việc'` |
| `stage_archived` | `COUNT(*) WHERE progression_stage IN ('Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')` |
| `type_tts` | `COUNT(*) WHERE trainee_type = 'TTS'` |
| `type_knd` | `COUNT(*) WHERE trainee_type = 'KyNang'` |
| `type_engineer` | `COUNT(*) WHERE trainee_type = 'KySu'` |
| `type_student` | `COUNT(*) WHERE trainee_type = 'DuHoc'` |
| `active_orders` | `COUNT(*) FROM orders WHERE status = 'active'` |

### 5.2. Biểu đồ theo tháng/năm

| View | Mô tả | Cột ngày sử dụng |
|------|-------|------------------|
| `dashboard_monthly_combined` | Tuyển dụng + Xuất cảnh theo tháng | `registration_date`, `departure_date` |
| `dashboard_trainee_monthly` | Số đăng ký theo tháng | `registration_date` |
| `dashboard_trainee_departures_monthly` | Số xuất cảnh theo tháng | `departure_date` |
| `dashboard_monthly_passed` | Số đậu PV theo tháng | `interview_pass_date` |
| `dashboard_trainee_passed_monthly` | Số đậu PV theo tháng (alt) | `interview_pass_date` |
| `v_trainees_registered_monthly` | Đăng ký theo tháng (mới) | `registration_date` |

### 5.3. Biểu đồ phân bố

| View | Mô tả | Cột group by |
|------|-------|--------------|
| `dashboard_trainee_by_gender` | Theo giới tính | `gender` |
| `dashboard_trainee_by_stage` | Theo giai đoạn | `progression_stage` |
| `dashboard_trainee_by_type` | Theo loại HV | `trainee_type` |
| `dashboard_trainee_by_source` | Theo nguồn giới thiệu | `source` |
| `dashboard_trainee_by_birthplace` | Theo quê quán | `birthplace` |
| `dashboard_trainee_by_company` | Theo công ty (năm) | `receiving_company_id`, `YEAR(interview_pass_date)` |

---

## PHỤ LỤC: CẤU TRÚC BẢNG CHÍNH

### trainees (70+ cột)

**Nhóm thông tin cá nhân:**
`id`, `trainee_code`, `full_name`, `furigana`, `gender`, `birth_date`, `birthplace`, `ethnicity`, `religion`, `marital_status`, `blood_group`

**Nhóm liên lạc:**
`phone`, `email`, `facebook`, `zalo`, `line_qr_url`, `current_address`, `permanent_address`, `household_address`

**Nhóm giấy tờ:**
`cccd_number`, `cccd_date`, `cccd_place`, `passport_number`, `passport_date`, `passport_place`

**Nhóm sức khỏe:**
`height`, `weight`, `vision_left`, `vision_right`, `hearing`, `dominant_hand`, `blood_group`, `hepatitis_b`, `tattoo`, `tattoo_description`, `smoking`, `drinking`, `health_status`

**Nhóm học vấn:**
`education_level`, `high_school_name`, `high_school_period`, `jp_school_1`, `jp_course_1`, `jp_school_2`, `jp_course_2`, `jp_certificate_school`, `jp_certificate_period`

**Nhóm nghiệp vụ:**
`registration_date`, `source`, `class_id`, `enrollment_status`, `progression_stage`, `simple_status`, `trainee_type`, `policy_category`

**Nhóm phỏng vấn/đơn hàng:**
`interview_pass_date`, `interview_count`, `receiving_company_id`, `union_id`, `job_category_id`, `expected_entry_month`

**Nhóm hồ sơ:**
`document_status`, `document_submission_date`, `otit_entry_date`, `nyukan_entry_date`, `coe_date`, `visa_date`

**Nhóm xuất cảnh:**
`departure_date`, `entry_date`, `contract_term`, `contract_end_date`, `expected_return_date`, `return_date`

**Nhóm sau xuất cảnh:**
`current_situation`, `early_return_date`, `early_return_reason`, `absconded_date`

**Nhóm bảo lãnh:**
`guarantor_name_vn`, `guarantor_name_jp`, `guarantor_phone`, `legal_address_vn`, `legal_address_jp`, `parent_phone_1`, `parent_phone_2`

**Nhóm khác:**
`photo_url`, `hobbies`, `shirt_size`, `pants_size`, `shoe_size`, `notes`, `created_at`, `updated_at`

---

*Tài liệu được tạo tự động từ hệ thống.*
