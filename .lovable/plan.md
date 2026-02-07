
## Bổ sung Xuất Excel cho các menu còn thiếu

### Tổng quan
Thêm nút "Xuất Excel" vào các trang từ menu Nghiệp vụ nội bộ đến Công đoàn nội bộ, bao gồm:
1. Công đoàn nội bộ (2 tabs: Thành viên + Giao dịch)
2. Quản lý KTX (Ký túc xá)
3. Danh sách lớp học (Đào tạo)
4. TTS đang ở Nhật (Sau xuất cảnh)
5. Danh sách đen (Blacklist)
6. Tình trạng hồ sơ (Legal)

### Chi tiết triển khai

#### 1. InternalUnionPage - Công đoàn nội bộ

**Vị trí nút:** Bên cạnh nút "Thêm thành viên" và "Thêm giao dịch" trong header

**Cấu hình:**
- Tab Thành viên: Xuất từ bảng `union_members`
- Tab Giao dịch: Thêm cấu hình mới cho `union_transactions`

```typescript
// Thêm config mới cho giao dịch
const internalUnionTransactionColumns = [
  { key: 'transaction_type', label: 'Loại giao dịch' },
  { key: 'amount', label: 'Số tiền', format: 'currency' },
  { key: 'transaction_date', label: 'Ngày giao dịch', format: 'date' },
  { key: 'member.full_name', label: 'Thành viên' },
  { key: 'description', label: 'Mô tả' },
];
```

---

#### 2. DormitoryPage - Quản lý KTX

**Vị trí nút:** Trong header bên phải (cùng hàng với tiêu đề)

**Cấu hình:**
- Xuất từ bảng `dormitories`
- Có thể thêm export cho danh sách cư dân KTX

---

#### 3. ClassList - Danh sách lớp học

**Vị trí nút:** Bên cạnh nút "Thêm lớp học"

**Cấu hình:**
- Xuất từ bảng `classes`
- Sử dụng config `education` đã có

---

#### 4. PostDeparturePage - Sau xuất cảnh

**Vị trí nút:** Trong header bên phải (cùng hàng với nút "Ẩn/Hiện biểu đồ")

**Cấu hình:**
- Xuất từ bảng `trainees` với filter `progression_stage` theo năm/trạng thái đã chọn

---

#### 5. ViolationsPage - Blacklist

**Vị trí nút:** Bên cạnh nút "THÊM VÀO BLACKLIST"

**Cấu hình:**
- Xuất từ bảng `trainee_reviews` với filter `is_blacklisted = true`

---

#### 6. LegalPage - Tình trạng hồ sơ

**Vị trí nút:** Trong header bên phải

**Cấu hình:**
- Xuất từ bảng `trainees` với filter học viên đậu PV chưa xuất cảnh

---

### Cập nhật export-configs.ts

Thêm cấu hình mới cho:
- `union_transactions` - Giao dịch công đoàn
- `dormitory_residents` - Cư dân KTX (tùy chọn)

---

### Danh sách Files cần sửa

| File | Thay đổi |
|------|----------|
| `src/lib/export-configs.ts` | Thêm config cho `union_transactions` |
| `src/pages/internal-union/InternalUnionPage.tsx` | Thêm ExportButtonWithColumns cho 2 tabs |
| `src/pages/dormitory/DormitoryPage.tsx` | Thêm ExportButtonWithColumns |
| `src/pages/education/ClassList.tsx` | Thêm ExportButtonWithColumns |
| `src/pages/post-departure/PostDeparturePage.tsx` | Thêm ExportButtonWithColumns |
| `src/pages/violations/ViolationsPage.tsx` | Thêm ExportButtonWithColumns |
| `src/pages/legal/LegalPage.tsx` | Thêm ExportButtonWithColumns |

---

### Mẫu tích hợp

```typescript
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';

// Trong JSX
<ExportButtonWithColumns
  menuKey="internal-union"
  tableName="union_members"
  allColumns={EXPORT_CONFIGS.internal_union.columns}
  fileName={EXPORT_CONFIGS.internal_union.fileName}
  selectQuery="*"
  title="Xuất danh sách thành viên công đoàn"
/>
```

---

### Lưu ý phân quyền

- Tất cả nút xuất đều kiểm tra quyền `can_export` theo `menuKey` tương ứng
- Nếu user không có quyền xuất, nút sẽ không hiển thị
- Dữ liệu xuất tuân thủ RLS (chỉ xuất dữ liệu user có quyền xem)
