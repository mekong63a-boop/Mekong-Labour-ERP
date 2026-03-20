

## Sửa KPI "Tổng xuất cảnh" — hiển thị đúng theo bộ lọc năm

### Yêu cầu
- Lọc "Tất cả" → hiển thị tổng tất cả HV đã xuất cảnh
- Lọc năm cụ thể → hiển thị số HV **xuất cảnh trong năm đó** (departure_date thuộc năm đó)

### Thay đổi — 1 file: `src/pages/post-departure/PostDeparturePage.tsx`

**1. Thêm `departedInYear` vào `stats` (dòng 269-293)**

Trong vòng lặp `forEach`, đếm thêm số HV có `departure_date` bắt đầu bằng `selectedYear`:

```typescript
let departedInYear = 0;
filtered.forEach(t => {
  // ... logic hiện tại ...
  if (!yearFilter || (t.departure_date && t.departure_date.startsWith(yearFilter))) {
    departedInYear++;
  }
});
```

- Khi lọc "Tất cả": `departedInYear` = tổng tất cả HV (vì `!yearFilter` = true)
- Khi lọc năm cụ thể: `departedInYear` = chỉ HV xuất cảnh đúng năm đó

**2. Hiển thị `stats.departedInYear` thay vì `stats.total` (dòng 539-540)**

```tsx
<p className="text-3xl font-bold text-primary mt-1">{stats.departedInYear}</p>
```

### Không ảnh hưởng
- Các KPI trạng thái (Đang ở Nhật, Bỏ trốn...) vẫn tính theo logic liên quan đến năm
- Danh sách bảng vẫn hiển thị tất cả HV liên quan đến năm
- Thẻ "Tổng xuất cảnh" luôn hiển thị, chỉ thay đổi con số

