# 📋 TÀI LIỆU HỆ THỐNG - MEKONG LABOUR ERP

> **Phiên bản:** 1.0.0  
> **Cập nhật:** 04/02/2026  
> **Production URL:** https://erpmekong.lovable.app

---

## 📑 MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Kỹ Thuật](#2-kiến-trúc-kỹ-thuật)
3. [Cơ Sở Dữ Liệu](#3-cơ-sở-dữ-liệu)
4. [Hệ Thống Phân Quyền](#4-hệ-thống-phân-quyền)
5. [Các Module Chức Năng](#5-các-module-chức-năng)
6. [Edge Functions](#6-edge-functions)
7. [Cấu Trúc Thư Mục](#7-cấu-trúc-thư-mục)
8. [Hướng Dẫn Vận Hành](#8-hướng-dẫn-vận-hành)
9. [Quy Tắc Phát Triển](#9-quy-tắc-phát-triển)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mục Đích
Mekong Labour ERP là hệ thống quản lý toàn diện cho công ty xuất khẩu lao động, bao gồm:
- Quản lý thực tập sinh (TTS) từ tuyển dụng đến xuất cảnh
- Đào tạo tiếng Nhật và theo dõi kết quả học tập
- Quản lý đối tác (Công ty, Nghiệp đoàn, Ngành nghề)
- Quản lý đơn hàng tuyển dụng
- Quản lý ký túc xá và hồ sơ pháp lý
- Dashboard thống kê và báo cáo

### 1.2. Người Dùng Mục Tiêu
- **Admin chính**: Toàn quyền hệ thống
- **Quản trị viên**: Quản lý người dùng và phân quyền
- **Nhân viên cấp cao**: Truy cập dữ liệu nhạy cảm (PII)
- **Nhân viên**: Thực hiện nghiệp vụ với dữ liệu đã được mask

### 1.3. Nguyên Tắc Thiết Kế Cốt Lõi

| Nguyên Tắc | Mô Tả |
|------------|-------|
| **Brain-Hands Separation** | Supabase là "Brain" (lõi logic), Lovable là "Hands" (UI/UX) |
| **Single Source of Truth** | Mỗi nghiệp vụ có đúng một nguồn dữ liệu duy nhất |
| **Scalability First** | Thiết kế cho hàng triệu bản ghi, 100+ tài khoản đồng thời |
| **Change Control** | Mọi thay đổi phải đánh giá tác động đến chức năng hiện có |

---

## 2. KIẾN TRÚC KỸ THUẬT

### 2.1. Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Lovable)                        │
├─────────────────────────────────────────────────────────────────┤
│  React 18.3.1  │  TypeScript  │  Vite  │  Tailwind CSS          │
│  React Query   │  React Router │  shadcn/ui  │  Lucide Icons     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase External)                   │
├─────────────────────────────────────────────────────────────────┤
│  Project ID: bcltzwpnhfpbfiuhfkxi                                │
│  PostgreSQL │ Auth │ Edge Functions │ Realtime │ Storage        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Thư Viện Chính

| Thư Viện | Version | Mục Đích |
|----------|---------|----------|
| `@supabase/supabase-js` | ^2.90.1 | Kết nối Supabase |
| `@tanstack/react-query` | ^5.83.0 | Data fetching & caching |
| `react-router-dom` | ^6.30.1 | Routing |
| `react-hook-form` | ^7.61.1 | Form handling |
| `zod` | ^3.25.76 | Validation |
| `recharts` | ^2.15.4 | Charts & visualization |
| `date-fns` | ^3.6.0 | Date utilities |
| `lucide-react` | ^0.462.0 | Icons |

### 2.3. Supabase Configuration

```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://bcltzwpnhfpbfiuhfkxi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIs...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Xử lý reset password từ email
  }
});
```

---

## 3. CƠ SỞ DỮ LIỆU

### 3.1. Sơ Đồ Quan Hệ Chính

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  trainees   │──────│   classes   │──────│  teachers   │
│  (Học viên) │      │   (Lớp)     │      │ (Giáo viên) │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│ companies   │      │ attendance  │
│ (Công ty)   │      │(Chuyên cần) │
└─────────────┘      └─────────────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   unions    │──────│   orders    │──────│job_categories│
│(Nghiệp đoàn)│      │ (Đơn hàng)  │      │(Ngành nghề) │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 3.2. Bảng Dữ Liệu Chính

#### **Quản lý Học viên**
| Bảng | Mô Tả | Quan hệ |
|------|-------|---------|
| `trainees` | Thông tin học viên chính | FK: class_id, job_category_id, union_id, receiving_company_id |
| `education_history` | Lịch sử học tập | FK: trainee_id |
| `work_history` | Kinh nghiệm làm việc | FK: trainee_id |
| `family_members` | Thành viên gia đình | FK: trainee_id |
| `japan_relatives` | Người thân tại Nhật | FK: trainee_id |
| `interview_history` | Lịch sử phỏng vấn | FK: trainee_id, company_id, union_id, job_category_id |
| `trainee_workflow` | Trạng thái luồng công việc | FK: trainee_id |
| `trainee_workflow_history` | Lịch sử chuyển trạng thái | FK: trainee_id |

#### **Quản lý Đào tạo**
| Bảng | Mô Tả |
|------|-------|
| `classes` | Danh sách lớp học |
| `teachers` | Danh sách giáo viên |
| `class_teachers` | Liên kết giáo viên - lớp |
| `attendance` | Điểm danh hàng ngày |
| `test_scores` | Điểm thi/kiểm tra |
| `trainee_reviews` | Đánh giá học viên |
| `enrollment_history` | Lịch sử chuyển lớp |

#### **Quản lý Đối tác & Đơn hàng**
| Bảng | Mô Tả |
|------|-------|
| `companies` | Công ty tiếp nhận |
| `unions` | Nghiệp đoàn |
| `job_categories` | Ngành nghề |
| `orders` | Đơn hàng tuyển dụng |

#### **Nội bộ & Vận hành**
| Bảng | Mô Tả |
|------|-------|
| `dormitories` | Ký túc xá |
| `dormitory_residents` | Học viên ở KTX |
| `handbook_entries` | Sổ tay hướng dẫn |
| `union_members` | Thành viên công đoàn nội bộ |
| `union_transactions` | Giao dịch công đoàn |

#### **Danh mục & Từ điển**
| Bảng | Mô Tả |
|------|-------|
| `katakana_names` | Chuyển đổi tên tiếng Việt → Katakana |
| `vocabulary` | Từ vựng Nhật-Việt |
| `hobbies` | Danh sách sở thích |
| `religions` | Danh sách tôn giáo |
| `referral_sources` | Nguồn giới thiệu |
| `passport_places` | Nơi cấp hộ chiếu |
| `cccd_places` | Nơi cấp CCCD |
| `policy_categories` | Phân loại chính sách |

#### **Hệ thống & Bảo mật**
| Bảng | Mô Tả |
|------|-------|
| `user_roles` | Vai trò người dùng |
| `departments` | Phòng ban |
| `department_members` | Nhân sự phòng ban |
| `menus` | Danh sách menu |
| `user_menu_permissions` | Quyền menu cá nhân |
| `department_menu_permissions` | Quyền menu phòng ban |
| `profiles` | Thông tin profile |
| `user_sessions` | Phiên đăng nhập |
| `login_attempts` | Lịch sử đăng nhập |
| `audit_logs` | Nhật ký hoạt động |

### 3.3. Database Views

| View | Mục Đích |
|------|----------|
| `trainees_with_workflow` | Học viên + trạng thái workflow |
| `companies_public` | Thông tin công ty công khai |
| `teachers_public` | Thông tin giáo viên công khai |
| `dormitories_with_occupancy` | KTX + sĩ số |
| `dashboard_monthly_combined` | Thống kê tuyển dụng/xuất cảnh theo tháng |
| `dashboard_monthly_passed` | Thống kê đậu phỏng vấn theo tháng |
| `dashboard_trainee_by_*` | Thống kê học viên theo các tiêu chí |
| `dashboard_trainee_kpis` | KPI tổng hợp |

### 3.4. Enums

```sql
-- Loại học viên
CREATE TYPE trainee_type AS ENUM ('TTS', 'DuHoc', 'KyNang');

-- Trạng thái đơn giản
CREATE TYPE simple_status AS ENUM ('ChuaDau', 'DaDau');

-- Giai đoạn tiến trình
CREATE TYPE progression_stage AS ENUM (
  'DauPV', 'DaoTao', 'ChoXuatCanh', 
  'DaXuatCanh', 'HoanThanhHD', 'VeNuocSom', 'BoTron', 'DanhSachDen'
);

-- Workflow stage
CREATE TYPE trainee_workflow_stage AS ENUM (
  'TUYEN_DUNG', 'PASSED_INTERVIEW', 'DAO_TAO', 
  'CHO_XUAT_CANH', 'DA_XUAT_CANH', 'HOAN_THANH', 
  'VE_NUOC_SOM', 'BO_TRON', 'DANH_SACH_DEN'
);

-- Role người dùng
CREATE TYPE app_role AS ENUM ('admin', 'staff');
```

---

## 4. HỆ THỐNG PHÂN QUYỀN

### 4.1. Mô Hình Phân Quyền

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRIMARY ADMIN                               │
│         (Toàn quyền - không cần kiểm tra permission)            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    ADMIN      │     │ SENIOR STAFF  │     │    STAFF      │
│(Quản trị viên)│     │(NV Cấp cao)   │     │  (Nhân viên)  │
│ + Quản lý user│     │ + Xem PII     │     │ - PII masked  │
│ + Xem PII     │     │ + Theo quyền  │     │ + Theo quyền  │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 4.2. Quyền Menu (CRUD)

Mỗi người dùng có thể được cấp quyền theo từng menu:

| Quyền | Mô Tả |
|-------|-------|
| `can_view` | Xem dữ liệu |
| `can_create` | Thêm mới |
| `can_update` | Chỉnh sửa |
| `can_delete` | Xóa |

### 4.3. Quyền Kế Thừa

```
Quyền Cá nhân (user_menu_permissions)
         +
Quyền Phòng ban (department_menu_permissions)
         ↓
    Merged Permissions (get_user_merged_permissions RPC)
```

### 4.4. Bảo Mật Dữ Liệu Nhạy Cảm (PII)

Các trường PII được mask cho nhân viên thường:
- Số điện thoại: `0912***456`
- CCCD/CMND: `036***789`
- Hộ chiếu: `B12***90`

Hook: `useSecureData.ts`

---

## 5. CÁC MODULE CHỨC NĂNG

### 5.1. Dashboard (`/dashboard/trainees`)

**Mục đích:** Tổng quan hoạt động và thống kê

**Thành phần:**
- KPI Cards: Tổng HV, HV hiện tại, HV tại Nhật, Đơn tuyển mới
- Biểu đồ tuyển dụng & xuất cảnh theo tháng
- Biểu đồ đậu phỏng vấn
- Top 10 công ty/nguồn giới thiệu

**Hook chính:** `useDashboardTrainee.ts`

### 5.2. Quản lý Học viên (`/trainees`)

**Mục đích:** Quản lý toàn bộ thông tin TTS

**Chức năng:**
- Danh sách học viên với bộ lọc nâng cao
- Thêm/sửa/xem chi tiết học viên
- Quét CCCD tự động nhập liệu
- Upload ảnh và Line QR
- Quản lý lịch sử học tập, công việc, gia đình
- Timeline trạng thái

**Components chính:**
- `TraineeTable.tsx` / `TraineeVirtualTable.tsx`
- `TraineeFilters.tsx`
- `PersonalInfoTab.tsx`
- `PersonalHistoryTab.tsx`
- `ProjectInterviewTab.tsx`
- `CCCDScanner.tsx`

**Hook chính:** `useTrainees.ts`, `useTraineesPaginated.ts`

### 5.3. Quản lý Đào tạo (`/education`)

**Mục đích:** Quản lý lớp học, giáo viên, điểm danh, điểm số

**Chức năng:**
- Dashboard đào tạo (sĩ số, vắng/trễ)
- Quản lý lớp học và giáo viên
- Điểm danh theo lịch
- Nhập/xem điểm thi
- Đánh giá học viên

**Pages:**
- `EducationDashboard.tsx`
- `ClassList.tsx`
- `TeacherList.tsx`
- `AttendanceCalendar.tsx`
- `TestScoresPage.tsx`
- `ClassStudentsPage.tsx`

**Hook chính:** `useEducation.ts`

### 5.4. Đơn Hàng Tuyển Dụng (`/orders`)

**Mục đích:** Quản lý đơn hàng từ đối tác

**Chức năng:**
- Danh sách đơn hàng
- Thêm/sửa đơn hàng
- Gán học viên vào đơn hàng
- Đồng bộ thông tin khi chọn đơn

**Hook chính:** `useOrders.ts`, `useOrderTrainees.ts`

### 5.5. Đối Tác (`/partners`)

**Mục đích:** Quản lý công ty, nghiệp đoàn, ngành nghề

**Tabs:**
- Công ty tiếp nhận
- Nghiệp đoàn
- Ngành nghề

**Hook chính:** `usePartners.ts`

### 5.6. Từ Điển/Danh Mục (`/glossary`)

**Mục đích:** Quản lý các danh mục hệ thống

**Tabs:**
- Chuyển đổi Katakana
- Từ vựng Nhật-Việt
- Sở thích, Tôn giáo
- Nơi cấp CCCD/Hộ chiếu
- Nguồn giới thiệu
- Phân loại chính sách

### 5.7. Ký Túc Xá (`/dormitory`)

**Mục đích:** Quản lý chỗ ở học viên

**Chức năng:**
- Danh sách KTX và sĩ số
- Check-in/check-out
- Chuyển phòng/KTX

**Hook chính:** `useDormitory.ts`

### 5.8. Hồ Sơ Pháp Lý (`/legal`)

**Mục đích:** Quản lý giấy tờ pháp lý

### 5.9. Sổ Tay (`/handbook`)

**Mục đích:** Hướng dẫn nghiệp vụ và quy trình

**Hook chính:** `useHandbook.ts`

### 5.10. Danh Sách Đen (`/violations`)

**Mục đích:** Theo dõi vi phạm và blacklist

### 5.11. Sau Xuất Cảnh (`/post-departure`)

**Mục đích:** Theo dõi học viên sau khi xuất cảnh

### 5.12. Công Đoàn Nội Bộ (`/internal-union`)

**Mục đích:** Quản lý công đoàn nội bộ công ty

**Hook chính:** `useInternalUnion.ts`

### 5.13. Báo Cáo (`/reports`)

**Mục đích:** Xuất báo cáo và hồ sơ

### 5.14. Quản Trị Hệ Thống (`/admin`)

**Mục đích:** Quản lý người dùng, phòng ban, phân quyền

**Tabs:**
- Người dùng & Vai trò
- Phòng ban
- Giám sát hệ thống

**Components:**
- `UserMenuPermissionsModal.tsx`
- `DepartmentMenuPermissionsModal.tsx`
- `DepartmentStaffModal.tsx`
- `SystemMonitorContent.tsx`

---

## 6. EDGE FUNCTIONS

### 6.1. Danh Sách Edge Functions

| Function | Mục Đích | Endpoint |
|----------|----------|----------|
| `scan-cccd` | Quét và trích xuất thông tin từ ảnh CCCD | `/functions/v1/scan-cccd` |
| `export-trainee-pdf` | Xuất hồ sơ học viên ra PDF | `/functions/v1/export-trainee-pdf` |
| `google-drive-upload` | Upload file lên Google Drive | `/functions/v1/google-drive-upload` |
| `weekly-backup` | Backup dữ liệu định kỳ | `/functions/v1/weekly-backup` |

### 6.2. Cấu Hình Edge Functions

```toml
# supabase/config.toml
[functions]
verify_jwt = false
```

---

## 7. CẤU TRÚC THƯ MỤC

```
📁 mekong-labour-erp/
├── 📁 src/
│   ├── 📁 assets/                 # Logo, hình ảnh
│   ├── 📁 components/
│   │   ├── 📁 admin/              # Components trang Admin
│   │   ├── 📁 auth/               # Authentication components
│   │   ├── 📁 education/          # Components đào tạo
│   │   ├── 📁 handbook/           # Components sổ tay
│   │   ├── 📁 layout/             # MainLayout, Sidebar
│   │   ├── 📁 security/           # AccessDenied, etc.
│   │   ├── 📁 trainees/           # Components quản lý học viên
│   │   │   ├── 📁 forms/          # Sub-forms (Education, Work, Family)
│   │   │   └── 📁 tabs/           # Tab contents
│   │   └── 📁 ui/                 # shadcn/ui components
│   ├── 📁 hooks/                  # Custom React hooks
│   ├── 📁 integrations/
│   │   └── 📁 supabase/           # Supabase client & types
│   ├── 📁 lib/                    # Utilities
│   ├── 📁 pages/                  # Page components
│   │   ├── 📁 admin/
│   │   ├── 📁 dashboard/
│   │   ├── 📁 dormitory/
│   │   ├── 📁 education/
│   │   ├── 📁 glossary/
│   │   ├── 📁 handbook/
│   │   ├── 📁 internal-union/
│   │   ├── 📁 legal/
│   │   ├── 📁 orders/
│   │   ├── 📁 partners/
│   │   ├── 📁 post-departure/
│   │   ├── 📁 reports/
│   │   └── 📁 violations/
│   ├── 📁 types/                  # TypeScript types
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── 📁 supabase/
│   ├── 📁 functions/              # Edge Functions
│   │   ├── export-trainee-pdf/
│   │   ├── google-drive-upload/
│   │   ├── scan-cccd/
│   │   └── weekly-backup/
│   └── config.toml
├── 📁 public/                     # Static assets
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 8. HƯỚNG DẪN VẬN HÀNH

### 8.1. Môi Trường

| Môi Trường | URL | Mô Tả |
|------------|-----|-------|
| Preview | https://id-preview--*.lovable.app | Test trước khi publish |
| Production | https://erpmekong.lovable.app | Live cho người dùng |

### 8.2. Supabase Dashboard

- **URL:** https://supabase.com/dashboard/project/bcltzwpnhfpbfiuhfkxi
- **Auth Settings:** https://supabase.com/dashboard/project/bcltzwpnhfpbfiuhfkxi/auth/url-configuration
- **Edge Function Logs:** https://supabase.com/dashboard/project/bcltzwpnhfpbfiuhfkxi/functions

### 8.3. Cấu Hình Auth URLs (Supabase Dashboard)

```
Site URL: https://erpmekong.lovable.app
Redirect URLs: https://erpmekong.lovable.app/**
```

### 8.4. Luồng Đăng Ký/Xác Nhận Email

```
1. User đăng ký tại /login
2. Email xác nhận được gửi với link redirect về production
3. User click link → redirect về /login với token
4. Supabase verify token và xác nhận email
5. User có thể đăng nhập
```

### 8.5. Rate Limiting

- 5 lần đăng nhập sai → khóa tạm thời
- RPC: `check_login_rate_limit`, `record_login_attempt`

### 8.6. Session Management

- Auto-refresh token
- Heartbeat tracking (`useSessionHeartbeat.ts`)
- Session timeout handling

---

## 9. QUY TẮC PHÁT TRIỂN

### 9.1. Quy Tắc Vàng

1. **Supabase = Brain**: Toàn bộ logic nghiệp vụ, RLS, triggers, functions nằm ở Supabase
2. **Lovable = Hands**: Chỉ UI/UX, gọi query, hiển thị dữ liệu
3. **Single Source of Truth**: Một nguồn dữ liệu duy nhất cho mỗi nghiệp vụ
4. **No Hardcode**: Không hardcode logic nghiệp vụ phía client
5. **Clean Up**: Xóa code dư thừa sau mỗi thay đổi

### 9.2. Coding Standards

```typescript
// ✅ Đúng: Dùng semantic tokens từ design system
<div className="bg-primary text-primary-foreground">

// ❌ Sai: Hardcode màu
<div className="bg-green-600 text-white">
```

### 9.3. Component Guidelines

- Components nhỏ, focused (< 300 dòng)
- Hooks riêng cho business logic
- Types rõ ràng từ Supabase types

### 9.4. Data Fetching

```typescript
// Sử dụng React Query với staleTime phù hợp
const { data, isLoading } = useQuery({
  queryKey: ['trainees'],
  queryFn: fetchTrainees,
  staleTime: 2 * 60 * 1000, // 2 phút
  refetchOnWindowFocus: false,
});
```

### 9.5. Permission Check

```typescript
// Check quyền trước khi render
const { canView, canCreate, canUpdate, canDelete } = useCanAccessMenu('trainees');

if (!canView) return <AccessDenied />;
```

---

## 📌 PHỤ LỤC

### A. Danh Sách Hooks

| Hook | Mô Tả |
|------|-------|
| `useAuth` | Authentication state |
| `useMenuPermissions` | Menu permissions |
| `useCanAccessMenu` | Check quyền menu |
| `useCanAction` | Check quyền action |
| `useTrainees` | CRUD trainees |
| `useTraineesPaginated` | Paginated trainees |
| `useEducation` | Education operations |
| `useOrders` | Order operations |
| `usePartners` | Partner operations |
| `useDormitory` | Dormitory operations |
| `useHandbook` | Handbook entries |
| `useInternalUnion` | Internal union |
| `useSecureData` | PII masking |
| `useAuditLog` | Activity logging |
| `useSessionHeartbeat` | Session tracking |
| `useKatakanaConverter` | Name conversion |
| `useDuplicateCheck` | Duplicate detection |

### B. Menu Keys

| Key | Label | Path |
|-----|-------|------|
| `dashboard` | Dashboard | /dashboard/trainees |
| `trainees` | Học viên | /trainees |
| `education` | Đào tạo | /education |
| `orders` | Đơn hàng | /orders |
| `partners` | Đối tác | /partners |
| `glossary` | Từ điển | /glossary |
| `dormitory` | Ký túc xá | /dormitory |
| `legal` | Hồ sơ pháp lý | /legal |
| `handbook` | Sổ tay | /handbook |
| `violations` | Danh sách đen | /violations |
| `post_departure` | Sau xuất cảnh | /post-departure |
| `internal_union` | Công đoàn | /internal-union |
| `reports` | Báo cáo | /reports |
| `admin` | Quản trị | /admin |

### C. Status Mapping

| Enum Value | Hiển Thị |
|------------|----------|
| `ChuaDau` | Chưa đậu |
| `DaDau` | Đã đậu |
| `DauPV` | Đậu PV |
| `DaoTao` | Đào tạo |
| `ChoXuatCanh` | Chờ xuất cảnh |
| `DaXuatCanh` | Đã xuất cảnh |
| `HoanThanhHD` | Hoàn thành HĐ |
| `VeNuocSom` | Về nước sớm |
| `BoTron` | Bỏ trốn |
| `DanhSachDen` | Danh sách đen |

---

> **Ghi chú:** Tài liệu này được tạo tự động và sẽ được cập nhật theo sự phát triển của hệ thống.
