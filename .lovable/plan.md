
## Thiết Kế Lại Dashboard Theo Mẫu Tham Khảo

Dựa trên hình mẫu bạn cung cấp, Dashboard mới sẽ có giao diện hiện đại hơn với các thành phần được bố trí khoa học và trực quan.

---

## Phân Tích Hình Mẫu

Theo hình ảnh tham khảo, Dashboard mới bao gồm:

**1. Header mới với:**
- Tiêu đề "Bảng điều khiển"
- Thanh tìm kiếm nhanh ở giữa
- Icon thông báo (chuông)
- Thông tin user góc phải (Avatar, tên, role)

**2. 4 KPI Cards ngang hàng với style mới:**
- Tổng số học viên (icon màu xanh dương, có chỉ số % tăng trưởng)
- Học viên hiện tại (icon màu xanh lá)
- Học viên tại Nhật (dạng "124 / 150" - tỷ lệ xuất cảnh thành công)
- Đơn tuyển dụng mới (icon màu cam)

**3. Biểu đồ "Tình hình tuyển dụng & Xuất cảnh" (Cột kép xanh/xanh dương):**
- Trục X: Tháng 1 → Tháng 7
- 2 loại cột: Tuyển dụng (xanh lá) và Xuất cảnh (xanh dương)
- Có dropdown chọn năm
- Hiển thị số liệu trực tiếp trên cột

**4. Biểu đồ Donut "Cơ cấu ngành nghề" bên phải:**
- Hiển thị tỷ lệ các ngành: Thực phẩm, Xây dựng, Cơ khí, May mặc
- Legend phía dưới với số lượng cụ thể

**5. Thanh tiến độ "Tiến độ hồ sơ học tập":**
- Progress bar hiển thị % hoàn thiện hồ sơ
- Thời gian cập nhật lần cuối

**6. Card "Chỉ tiêu năm 2024":**
- Hiển thị dạng "500 / 1000"
- Tiến độ đạt chỉ tiêu

---

## Chi Tiết Kỹ Thuật

### 1. MainLayout - Thêm Header mới

**File:** `src/components/layout/MainLayout.tsx`

**Thay đổi:**
- Thêm thanh tìm kiếm nhanh ở header
- Thêm icon thông báo (Bell)
- Thêm Avatar và thông tin user (tên, role) góc phải
- Giữ nguyên nút "Làm mới dữ liệu"

```text
┌───────────────────────────────────────────────────────────────────┐
│ ☰  Bảng điều khiển     │ 🔍 Tìm kiếm nhanh...  │ 🔔  👤 Admin User │
│                        │                        │      Chủ quản HT  │
└───────────────────────────────────────────────────────────────────┘
```

### 2. TraineeDashboard - Redesign hoàn toàn

**File:** `src/pages/dashboard/TraineeDashboard.tsx`

**Thay đổi chính:**

#### 2.1. KPI Cards với style mới
```text
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 👥 TỔNG SỐ HV   │ │ 🎓 HỌC VIÊN      │ │ 📍 HV TẠI NHẬT   │ │ 📋 ĐƠN TUYỂN    │
│     142         │ │ HIỆN TẠI: 45     │ │    124 / 150     │ │ DỤNG MỚI: 08    │
│ Học viên toàn HT│ │ Đang đào tạo     │ │ Tỷ lệ xuất cảnh  │ │ Cần bổ sung     │
│           ↑12%  │ │           ↑12%   │ │           ↑12%   │ │           ↑12%  │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

- Icon lớn với background tròn, màu sắc tương ứng (xanh dương, xanh lá, cam, tím)
- Chỉ số tăng trưởng (%) so với tháng/năm trước
- Subtitle mô tả ngắn gọn

#### 2.2. Biểu đồ chính - Grouped Bar Chart
- **Tuyển dụng vs Xuất cảnh theo tháng**
- Màu xanh lá (#22C55E) cho Tuyển dụng
- Màu xanh dương (#3B82F6) cho Xuất cảnh
- Dropdown chọn năm phía trên góc phải
- Labels số liệu hiển thị trực tiếp trên cột

#### 2.3. Biểu đồ Donut - Cơ cấu ngành nghề
- Lấy dữ liệu từ `job_categories` liên kết với `trainees.job_category_id`
- Hiển thị tỷ lệ % các ngành nghề
- Legend ở dưới với số lượng cụ thể
- Màu sắc: Cam, Đỏ, Xanh đậm, Xanh dương

#### 2.4. Thanh tiến độ - Hoàn thiện hồ sơ
- Tính tỷ lệ học viên có đầy đủ thông tin
- Hiển thị % và progress bar
- Thời gian cập nhật cuối

#### 2.5. Card Chỉ tiêu năm
- Tổng hợp từ `orders.quantity` (chỉ tiêu)
- So sánh với số đã xuất cảnh (đạt được)

### 3. Hooks mới cần tạo

**File:** `src/hooks/useDashboardStats.ts`

```typescript
// Hook lấy thống kê theo ngành nghề
export const useTraineeByJobCategory = () => {...}

// Hook tính % tăng trưởng so với kỳ trước
export const useGrowthRate = () => {...}

// Hook tính chỉ tiêu năm (từ orders)
export const useYearlyTarget = () => {...}

// Hook tính tỷ lệ hoàn thiện hồ sơ
export const useProfileCompletionRate = () => {...}
```

### 4. CSS/Styling updates

**File:** `src/index.css`

Thêm các class mới:
```css
/* KPI Card with colored icon */
.kpi-icon-box {
  @apply w-14 h-14 rounded-2xl flex items-center justify-center;
}

.kpi-icon-blue { @apply bg-blue-100 text-blue-600; }
.kpi-icon-green { @apply bg-green-100 text-green-600; }
.kpi-icon-orange { @apply bg-orange-100 text-orange-600; }
.kpi-icon-purple { @apply bg-purple-100 text-purple-600; }

/* Growth indicator */
.growth-positive { @apply text-green-600 text-sm font-medium; }
.growth-negative { @apply text-red-600 text-sm font-medium; }
```

---

## Bố Cục Dashboard Mới

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                         │
│  ☰  Bảng điều khiển    🔍 Tìm kiếm nhanh...        🔔  👤 Admin User       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Tổng số HV  │ │ HV hiện tại │ │ HV tại Nhật │ │ Đơn TĐ mới  │           │
│  │    142      │ │     45      │ │  124/150    │ │     08      │           │
│  │       ↑12%  │ │       ↑12%  │ │       ↑12%  │ │       ↑12%  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────┐   │
│  │     Tình hình tuyển dụng & Xuất cảnh   │ │    Cơ cấu ngành nghề    │   │
│  │             Năm 2024 ▼                 │ │                          │   │
│  │    ┌──┐  ┌──┐                          │ │        🍩 Donut         │   │
│  │    │██│  │██│ ┌──┐  ┌──┐  ┌──┐  ┌──┐  │ │                          │   │
│  │    │██│  │██│ │██│  │██│  │██│  │██│  │ │  ● Thực phẩm    400      │   │
│  │    └──┘  └──┘ └──┘  └──┘  └──┘  └──┘  │ │  ● Xây dựng     300      │   │
│  │    T1    T2    T3    T4    T5    T6   │ │  ● Cơ khí       300      │   │
│  │    ■ Tuyển dụng  ■ Xuất cảnh          │ │  ● May mặc      200      │   │
│  └────────────────────────────────────────┘ └──────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────┐   │
│  │  Tiến độ hồ sơ học tập                 │ │  Chỉ tiêu năm 2024       │   │
│  │                       Cập nhật 09:00   │ │                 500/1000 │   │
│  │  Hoàn thiện hồ sơ           82%        │ │  ██████████░░░░░░░░░░░░░ │   │
│  │  ████████████████████░░░░░░            │ │                          │   │
│  └────────────────────────────────────────┘ └──────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Các File Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/layout/MainLayout.tsx` | Thêm search box, notification bell, user info vào header |
| `src/pages/dashboard/TraineeDashboard.tsx` | Redesign hoàn toàn layout và components |
| `src/hooks/useDashboardTrainee.ts` | Thêm hooks mới cho job category stats, growth rate |
| `src/index.css` | Thêm CSS classes cho KPI cards mới |

---

## Dữ Liệu Cần Truy Vấn Thêm

1. **Thống kê theo ngành nghề:**
   - Query `trainees` GROUP BY `job_category_id`
   - JOIN với `job_categories` để lấy tên ngành

2. **Tỷ lệ tăng trưởng:**
   - So sánh số liệu tháng này vs tháng trước
   - Công thức: `((this_month - last_month) / last_month) * 100`

3. **Chỉ tiêu năm:**
   - SUM(`orders.quantity`) cho năm hiện tại
   - So với COUNT trainees đã xuất cảnh trong năm

4. **Tỷ lệ hoàn thiện hồ sơ:**
   - Đếm số trường bắt buộc đã điền / tổng số trường bắt buộc

---

## Lưu Ý Quan Trọng

- Giữ nguyên logic KPI hiện tại (click để xem chi tiết)
- Không thay đổi DashboardDetailList (trang chi tiết)
- Responsive design cho tablet/mobile
- Tuân thủ màu sắc brand Mekong (xanh lá chủ đạo #006633)
- Giữ nguyên bộ lọc năm/tháng hiện có
