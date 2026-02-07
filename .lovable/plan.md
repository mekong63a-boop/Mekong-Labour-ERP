
## Triển khai Quyền Xuất File (can_export) và Tùy Chỉnh Cột Xuất

### Tổng quan yêu cầu
1. **Thêm quyền "Xuất file" (can_export)** vào hệ thống phân quyền menu
2. **Mở rộng xuất file** cho tất cả menu có dữ liệu (không chỉ trainees, orders, partners)
3. **Tùy chỉnh cột xuất** - cho phép user chọn cột nào cần xuất ra Excel

---

### Kiến trúc giải pháp

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          DATABASE                                     │
├──────────────────────────────────────────────────────────────────────┤
│  user_menu_permissions                                               │
│  ├── can_view, can_create, can_update, can_delete                   │
│  └── can_export (MỚI)  ← Thêm cột mới                               │
│                                                                      │
│  department_menu_permissions                                         │
│  └── can_export (MỚI)  ← Thêm cột mới                               │
│                                                                      │
│  get_user_merged_permissions()                                       │
│  └── Cập nhật để gộp can_export từ cả 2 nguồn                       │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                     UI PHÂN QUYỀN (Modal)                            │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────┬───────┬───────┬──────┬──────┬──────────┐              │
│  │ Menu    │  Xem  │ Thêm  │ Sửa  │ Xóa  │ Xuất file│              │
│  ├─────────┼───────┼───────┼──────┼──────┼──────────┤              │
│  │ Học viên│  ✓    │  ✓    │  ✓   │  ✓   │    ✓     │              │
│  │ Đơn hàng│  ✓    │  ✓    │  ✓   │  ✓   │    ✓     │              │
│  │ ...     │       │       │      │      │          │              │
│  └─────────┴───────┴───────┴──────┴──────┴──────────┘              │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                     EXPORT SYSTEM                                    │
├──────────────────────────────────────────────────────────────────────┤
│  useMenuPermissions()                                                │
│  └── canExport ← Thêm thuộc tính mới                                │
│                                                                      │
│  useExportExcel()                                                    │
│  └── Kiểm tra canExport thay vì canView                             │
│                                                                      │
│  ExportButtonWithColumnSelect (MỚI)                                  │
│  └── Dialog chọn cột trước khi xuất                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Chi tiết triển khai

#### PHASE 1: Database Migration (Thêm cột can_export)

**Migration SQL:**
```sql
-- 1. Thêm cột can_export vào user_menu_permissions
ALTER TABLE public.user_menu_permissions 
ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;

-- 2. Thêm cột can_export vào department_menu_permissions
ALTER TABLE public.department_menu_permissions 
ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;

-- 3. Cập nhật function get_user_merged_permissions để gộp can_export
CREATE OR REPLACE FUNCTION public.get_user_merged_permissions(_user_id uuid)
RETURNS TABLE (
  menu_key text,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  can_export boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Quyền cá nhân
  user_perms AS (
    SELECT 
      ump.menu_key,
      COALESCE(ump.can_view, false) as can_view,
      COALESCE(ump.can_create, false) as can_create,
      COALESCE(ump.can_update, false) as can_update,
      COALESCE(ump.can_delete, false) as can_delete,
      COALESCE(ump.can_export, false) as can_export
    FROM user_menu_permissions ump
    WHERE ump.user_id = _user_id
  ),
  -- Quyền phòng ban (lấy từ tất cả phòng ban user thuộc về)
  dept_perms AS (
    SELECT 
      dmp.menu_key,
      bool_or(COALESCE(dmp.can_view, false)) as can_view,
      bool_or(COALESCE(dmp.can_create, false)) as can_create,
      bool_or(COALESCE(dmp.can_update, false)) as can_update,
      bool_or(COALESCE(dmp.can_delete, false)) as can_delete,
      bool_or(COALESCE(dmp.can_export, false)) as can_export
    FROM department_menu_permissions dmp
    INNER JOIN department_members dm ON dm.department = dmp.department
    WHERE dm.user_id = _user_id
    GROUP BY dmp.menu_key
  ),
  -- Gộp quyền (logical OR)
  all_keys AS (
    SELECT menu_key FROM user_perms
    UNION
    SELECT menu_key FROM dept_perms
  )
  SELECT 
    ak.menu_key,
    COALESCE(up.can_view, false) OR COALESCE(dp.can_view, false) as can_view,
    COALESCE(up.can_create, false) OR COALESCE(dp.can_create, false) as can_create,
    COALESCE(up.can_update, false) OR COALESCE(dp.can_update, false) as can_update,
    COALESCE(up.can_delete, false) OR COALESCE(dp.can_delete, false) as can_delete,
    COALESCE(up.can_export, false) OR COALESCE(dp.can_export, false) as can_export
  FROM all_keys ak
  LEFT JOIN user_perms up ON ak.menu_key = up.menu_key
  LEFT JOIN dept_perms dp ON ak.menu_key = dp.menu_key;
END;
$$;
```

---

#### PHASE 2: Cập nhật Frontend Hooks

**2.1. Cập nhật `useMenuPermissions.ts`:**
- Thêm `can_export` vào interface `MenuPermission`
- Cập nhật `useCanAccessMenu()` trả về `canExport`
- Thêm action mới `export` cho `useCanAction()`

**2.2. Cập nhật `useExportExcel.ts`:**
- Thay đổi kiểm tra từ `canView` → `canExport`
- Nếu có `canExport` thì cho phép xuất (không cần `canView`)

---

#### PHASE 3: Cập nhật UI Phân Quyền

**3.1. Cập nhật `UserMenuPermissionsModal.tsx`:**
- Thêm cột "Xuất file" với icon `FileSpreadsheet`
- Thêm checkbox `can_export` cho mỗi menu
- Thêm hàng "Chọn tất cả" cho cột Xuất file
- Logic: Bật `can_export` → tự động bật `can_view`

**3.2. Cập nhật `DepartmentMenuPermissionsModal.tsx`:**
- Tương tự như UserMenuPermissionsModal
- Thêm cột và logic cho `can_export`

---

#### PHASE 4: Component Chọn Cột Xuất

**Tạo mới `ExportButtonWithColumnSelect.tsx`:**
```typescript
interface ExportButtonWithColumnSelectProps {
  menuKey: string;
  tableName: string;
  allColumns: ExportColumn[];  // Tất cả cột có thể xuất
  defaultColumns: string[];    // Cột mặc định đã chọn
  fileName: string;
  selectQuery: string;
  filters?: Record<string, any>;
}

// Component hiển thị:
// 1. Nút "Xuất Excel" (nếu có quyền)
// 2. Click → Mở Dialog chọn cột
// 3. User tick chọn cột → Nhấn "Xuất"
// 4. Xuất file với các cột đã chọn
```

**Dialog chọn cột:**
```text
┌────────────────────────────────────────┐
│  📊 Xuất Excel - Danh sách Học viên    │
├────────────────────────────────────────┤
│  ☑ Chọn tất cả                         │
│  ─────────────────────────────────────│
│  ☑ Mã HV                               │
│  ☑ Họ và tên                           │
│  ☑ Ngày sinh                           │
│  ☐ Số điện thoại                       │
│  ☐ Số CCCD                             │
│  ☑ Giai đoạn                           │
│  ☑ Trạng thái                          │
│  ...                                   │
├────────────────────────────────────────┤
│           [Hủy]  [Xuất 7 cột]          │
└────────────────────────────────────────┘
```

---

#### PHASE 5: Mở rộng Export cho tất cả Menu

**Cập nhật `export-configs.ts`:**
Thêm cấu hình xuất cho các menu còn thiếu:
- `post_departure` - Sau xuất cảnh
- `violations` - Blacklist  
- `internal_union` - Công đoàn nội bộ
- `legal` - Tình trạng hồ sơ
- `handbook` - Cẩm nang tư vấn
- `glossary` - Từ điển chuyên ngành

**Tích hợp ExportButton vào các trang:**
- `PostDeparturePage.tsx`
- `ViolationsPage.tsx`
- `InternalUnionPage.tsx`
- `LegalPage.tsx`
- `HandbookPage.tsx`
- `GlossaryPage.tsx`
- `ClassList.tsx` (Education)
- `DormitoryPage.tsx`

---

### Danh sách Files cần tạo/sửa

| File | Loại | Mô tả |
|------|------|-------|
| `supabase/migrations/20260207_add_can_export.sql` | Tạo mới | Thêm cột can_export + cập nhật function |
| `src/hooks/useMenuPermissions.ts` | Sửa | Thêm canExport vào interface và hooks |
| `src/hooks/useExportExcel.ts` | Sửa | Kiểm tra canExport thay vì canView |
| `src/components/admin/UserMenuPermissionsModal.tsx` | Sửa | Thêm cột "Xuất file" |
| `src/components/admin/DepartmentMenuPermissionsModal.tsx` | Sửa | Thêm cột "Xuất file" |
| `src/components/ui/export-button-with-columns.tsx` | Tạo mới | Component xuất với chọn cột |
| `src/lib/export-configs.ts` | Sửa | Thêm config cho các menu còn thiếu |
| Các trang list (10+ files) | Sửa | Thêm ExportButton |

---

### Tiêu chí nghiệm thu

1. **Phân quyền Xuất file:**
   - Admin tick "Xuất file" cho user A menu Học viên
   - User A vào trang Học viên → thấy nút "Xuất Excel"
   - User B không được tick → KHÔNG thấy nút xuất

2. **Chọn cột linh hoạt:**
   - Click "Xuất Excel" → Dialog chọn cột xuất hiện
   - Bỏ tick một số cột → Xuất file chỉ có các cột đã chọn

3. **Tất cả menu đều xuất được:**
   - Vào từng trang (Học viên, Đơn hàng, Đối tác, Đào tạo, KTX, Sau xuất cảnh, Blacklist...) → đều có nút Xuất Excel

4. **Kế thừa quyền phòng ban:**
   - Tick "Xuất file" cho Phòng Đào tạo → Tất cả nhân viên thuộc phòng có quyền xuất

---

### Lưu ý bảo mật

- `can_export` tuân thủ RLS như các quyền khác
- Dữ liệu xuất vẫn được filter theo RLS (user chỉ xuất dữ liệu họ có quyền xem)
- PII masking vẫn áp dụng cho non-senior staff
- Primary Admin có quyền xuất tất cả (như các quyền khác)
