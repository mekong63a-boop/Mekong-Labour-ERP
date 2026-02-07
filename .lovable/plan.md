
## Triển khai Xuất Excel theo Phân Quyền Menu

### Tổng quan
Xây dựng hệ thống xuất dữ liệu ra Excel linh hoạt, tuân thủ:
1. **Phân quyền menu**: Chỉ xuất được dữ liệu của menu mà người dùng có quyền xem
2. **Kiểm soát cột**: Mỗi phòng ban chỉ xuất được các cột phù hợp với nghiệp vụ của họ
3. **RLS tự động**: Dữ liệu xuất ra tuân thủ Row-Level Security đã có sẵn
4. **Tối ưu hiệu suất**: Phân trang khi xuất lượng lớn, tránh làm chậm hệ thống

---

### Kiến trúc giải pháp

```text
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────┤
│  1. ExportButton (component dùng chung)                         │
│     - Hiển thị nếu user có quyền xem menu đó                    │
│     - Props: menuKey, exportConfig, filters                     │
│                                                                 │
│  2. useExportExcel (hook)                                       │
│     - Gọi Supabase query với filters hiện tại                   │
│     - Phân trang khi > 1000 records                             │
│     - Chuyển dữ liệu → xlsx → download                          │
│                                                                 │
│  3. exportConfigs (cấu hình theo menu)                          │
│     - Định nghĩa cột nào được xuất cho mỗi menu                 │
│     - Map tên cột VN cho header Excel                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (RLS)                              │
├─────────────────────────────────────────────────────────────────┤
│  - RLS policies tự động lọc dữ liệu theo quyền user             │
│  - can_view('trainees') → chỉ trả dữ liệu user được xem         │
│  - PII masking đã có sẵn cho non-senior staff                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Chi tiết triển khai

#### 1. Cài đặt thư viện SheetJS (xlsx)

Thêm dependency `xlsx` vào project:
```bash
npm install xlsx
```

---

#### 2. Tạo Export Configurations (`src/lib/export-configs.ts`)

Định nghĩa cột xuất cho từng menu với tên tiếng Việt:

```typescript
// Cấu hình xuất Excel theo menu
export const EXPORT_CONFIGS = {
  trainees: {
    menuKey: 'trainees',
    fileName: 'danh-sach-hoc-vien',
    columns: [
      { key: 'trainee_code', label: 'Mã HV' },
      { key: 'full_name', label: 'Họ và tên' },
      { key: 'birth_date', label: 'Ngày sinh', format: 'date' },
      { key: 'gender', label: 'Giới tính' },
      { key: 'birthplace', label: 'Quê quán' },
      { key: 'progression_stage', label: 'Giai đoạn' },
      { key: 'receiving_company.name', label: 'Công ty tiếp nhận' },
      { key: 'union.name', label: 'Nghiệp đoàn' },
      { key: 'job_category.name', label: 'Ngành nghề' },
      // ... các cột khác
    ]
  },
  orders: {
    menuKey: 'orders',
    fileName: 'danh-sach-don-hang',
    columns: [
      { key: 'code', label: 'Mã đơn hàng' },
      { key: 'company.name', label: 'Công ty' },
      { key: 'job_category.name', label: 'Ngành nghề' },
      { key: 'work_address', label: 'Địa chỉ làm việc' },
      { key: 'quantity', label: 'Số lượng tuyển' },
      { key: 'expected_interview_date', label: 'Ngày PV dự kiến', format: 'date' },
      { key: 'status', label: 'Trạng thái' },
    ]
  },
  partners: {
    menuKey: 'partners',
    fileName: 'danh-sach-doi-tac',
    // Có 3 sub-tabs: companies, unions, job_categories
    tabs: {
      companies: {
        fileName: 'danh-sach-cong-ty',
        columns: [
          { key: 'code', label: 'Mã công ty' },
          { key: 'name', label: 'Tên công ty' },
          { key: 'name_japanese', label: 'Tên tiếng Nhật' },
          { key: 'industry', label: 'Ngành nghề' },
          { key: 'work_address', label: 'Địa chỉ làm việc' },
          { key: 'representative', label: 'Người phụ trách' },
          { key: 'status', label: 'Trạng thái' },
        ]
      },
      unions: {
        fileName: 'danh-sach-nghiep-doan',
        columns: [
          { key: 'code', label: 'Mã nghiệp đoàn' },
          { key: 'name', label: 'Tên nghiệp đoàn' },
          { key: 'name_japanese', label: 'Tên tiếng Nhật' },
          { key: 'address', label: 'Địa chỉ' },
          { key: 'contact_person', label: 'Người liên hệ' },
          { key: 'phone', label: 'Điện thoại' },
          { key: 'status', label: 'Trạng thái' },
        ]
      },
      job_categories: {
        fileName: 'danh-sach-nganh-nghe',
        columns: [
          { key: 'code', label: 'Mã ngành' },
          { key: 'name', label: 'Tên ngành nghề' },
          { key: 'name_japanese', label: 'Tên tiếng Nhật' },
          { key: 'category', label: 'Danh mục' },
          { key: 'description', label: 'Mô tả' },
          { key: 'status', label: 'Trạng thái' },
        ]
      }
    }
  },
  education: {
    menuKey: 'education',
    fileName: 'danh-sach-lop-hoc',
    columns: [
      { key: 'class_code', label: 'Mã lớp' },
      { key: 'class_name', label: 'Tên lớp' },
      { key: 'teacher.name', label: 'Giáo viên' },
      { key: 'student_count', label: 'Số học viên' },
      { key: 'status', label: 'Trạng thái' },
    ]
  },
  post_departure: {
    menuKey: 'post_departure',
    fileName: 'danh-sach-sau-xuat-canh',
    columns: [
      { key: 'trainee_code', label: 'Mã HV' },
      { key: 'full_name', label: 'Họ và tên' },
      { key: 'departure_date', label: 'Ngày xuất cảnh', format: 'date' },
      { key: 'receiving_company.name', label: 'Công ty' },
      { key: 'current_situation', label: 'Tình trạng hiện tại' },
      { key: 'expected_return_date', label: 'Ngày dự kiến về', format: 'date' },
    ]
  },
  // ... các menu khác
};
```

---

#### 3. Tạo Hook xuất Excel (`src/hooks/useExportExcel.ts`)

```typescript
import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useCanAccessMenu } from '@/hooks/useMenuPermissions';
import { formatVietnameseDate } from '@/lib/vietnamese-utils';
import { toast } from 'sonner';

interface ExportColumn {
  key: string;
  label: string;
  format?: 'date' | 'number' | 'currency';
}

interface UseExportExcelOptions {
  menuKey: string;
  tableName: string;
  columns: ExportColumn[];
  fileName: string;
  selectQuery?: string; // Custom select query
  filters?: Record<string, any>; // Current filters from UI
}

export function useExportExcel(options: UseExportExcelOptions) {
  const { menuKey, tableName, columns, fileName, selectQuery, filters } = options;
  const { canView, isLoading: permissionLoading } = useCanAccessMenu(menuKey);
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(async () => {
    if (!canView) {
      toast.error('Bạn không có quyền xuất dữ liệu này');
      return;
    }

    setIsExporting(true);
    try {
      // Build query
      let query = supabase
        .from(tableName)
        .select(selectQuery || '*');

      // Apply filters from UI state
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            query = query.eq(key, value);
          }
        });
      }

      // Fetch all data (với phân trang nếu cần)
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        
        allData = [...allData, ...(data || [])];
        hasMore = data?.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      if (allData.length === 0) {
        toast.warning('Không có dữ liệu để xuất');
        return;
      }

      // Transform data to Excel format
      const excelData = allData.map(row => {
        const excelRow: Record<string, any> = {};
        columns.forEach(col => {
          const value = getNestedValue(row, col.key);
          excelRow[col.label] = formatValue(value, col.format);
        });
        return excelRow;
      });

      // Create workbook and export
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');

      // Auto-width columns
      const colWidths = columns.map(col => ({
        wch: Math.max(col.label.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFileName = `${fileName}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fullFileName);
      toast.success(`Đã xuất ${allData.length} bản ghi`);
    } catch (error: any) {
      toast.error('Lỗi khi xuất dữ liệu: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [canView, tableName, selectQuery, filters, columns, fileName]);

  return {
    exportToExcel,
    isExporting,
    canExport: canView && !permissionLoading,
  };
}

// Helper: lấy giá trị từ nested object (vd: 'company.name')
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Helper: format giá trị theo type
function formatValue(value: any, format?: string): any {
  if (value == null) return '';
  if (format === 'date') return formatVietnameseDate(value);
  if (format === 'currency') return new Intl.NumberFormat('vi-VN').format(value);
  return value;
}
```

---

#### 4. Tạo Component ExportButton (`src/components/ui/export-button.tsx`)

```typescript
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useExportExcel } from '@/hooks/useExportExcel';

interface ExportButtonProps {
  menuKey: string;
  tableName: string;
  columns: Array<{ key: string; label: string; format?: string }>;
  fileName: string;
  selectQuery?: string;
  filters?: Record<string, any>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
}

export function ExportButton({
  menuKey,
  tableName,
  columns,
  fileName,
  selectQuery,
  filters,
  variant = 'outline',
  size = 'sm',
  label = 'Xuất Excel',
}: ExportButtonProps) {
  const { exportToExcel, isExporting, canExport } = useExportExcel({
    menuKey,
    tableName,
    columns,
    fileName,
    selectQuery,
    filters,
  });

  if (!canExport) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={exportToExcel}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
```

---

#### 5. Tích hợp vào các trang List

**TraineeList.tsx** - thêm nút xuất:
```typescript
// Import
import { ExportButton } from '@/components/ui/export-button';
import { EXPORT_CONFIGS } from '@/lib/export-configs';

// Trong JSX, thêm bên cạnh nút "Thêm học viên"
<ExportButton
  menuKey="trainees"
  tableName="trainees"
  columns={EXPORT_CONFIGS.trainees.columns}
  fileName={EXPORT_CONFIGS.trainees.fileName}
  selectQuery={`
    id, trainee_code, full_name, birth_date, gender, birthplace,
    progression_stage, simple_status, trainee_type,
    receiving_company:companies(name),
    union:unions(name),
    job_category:job_categories(name)
  `}
  filters={{ progression_stage: progressionStage !== 'all' ? progressionStage : undefined }}
/>
```

**OrderList.tsx** - thêm nút xuất:
```typescript
<ExportButton
  menuKey="orders"
  tableName="orders"
  columns={EXPORT_CONFIGS.orders.columns}
  fileName={EXPORT_CONFIGS.orders.fileName}
  selectQuery={`
    *,
    company:companies(name),
    union:unions(name),
    job_category:job_categories(name)
  `}
/>
```

**PartnerList.tsx** - thêm nút xuất theo tab:
```typescript
<ExportButton
  menuKey="partners"
  tableName={activeTab === 'companies' ? 'companies' : activeTab === 'unions' ? 'unions' : 'job_categories'}
  columns={EXPORT_CONFIGS.partners.tabs[activeTab].columns}
  fileName={EXPORT_CONFIGS.partners.tabs[activeTab].fileName}
/>
```

---

### Bảo mật tự động theo RLS

| Tầng | Cơ chế bảo mật | Ghi chú |
|------|---------------|---------|
| **Frontend** | `useCanAccessMenu(menuKey)` | Ẩn nút nếu không có quyền xem menu |
| **Query** | `supabase.from(tableName)` | Query chạy với token của user hiện tại |
| **Supabase RLS** | `can_view('trainees')` | Chỉ trả dữ liệu user được phép xem |
| **PII Masking** | Trigger `mask_phone`, `mask_cccd` | Dữ liệu nhạy cảm được mask cho non-senior staff |

---

### Tóm tắt files cần tạo/sửa

| File | Loại | Mô tả |
|------|------|-------|
| `package.json` | Sửa | Thêm dependency `xlsx` |
| `src/lib/export-configs.ts` | Tạo mới | Cấu hình cột xuất cho từng menu |
| `src/hooks/useExportExcel.ts` | Tạo mới | Hook xử lý logic xuất Excel |
| `src/components/ui/export-button.tsx` | Tạo mới | Component nút xuất dùng chung |
| `src/pages/TraineeList.tsx` | Sửa | Thêm ExportButton |
| `src/pages/orders/OrderList.tsx` | Sửa | Thêm ExportButton |
| `src/pages/partners/PartnerList.tsx` | Sửa | Thêm ExportButton |

---

### Tiêu chí nghiệm thu (E2E Testing)

1. **Test quyền xuất:**
   - Đăng nhập user có quyền xem menu Học viên → thấy nút "Xuất Excel"
   - Đăng nhập user KHÔNG có quyền xem menu Đơn hàng → KHÔNG thấy nút xuất ở trang Đơn hàng

2. **Test dữ liệu xuất:**
   - Xuất danh sách học viên với filter "Giai đoạn = Đậu phỏng vấn" → file Excel chỉ chứa học viên đã đậu PV
   - Mở file Excel → kiểm tra các cột header đúng tiếng Việt

3. **Test PII Masking:**
   - Đăng nhập nhân viên thường (non-senior) → xuất Excel → số điện thoại, CCCD bị mask
   - Đăng nhập nhân viên cấp cao → xuất Excel → thấy đầy đủ thông tin

4. **Test hiệu suất:**
   - Xuất 5000+ học viên → hoàn thành trong < 10 giây, không làm đơ UI
