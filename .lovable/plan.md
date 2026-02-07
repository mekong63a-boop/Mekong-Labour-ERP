
## TRIỂN KHAI: Tự động cập nhật dữ liệu giữa các Menu

### Tổng quan vấn đề
Hiện tại khi người dùng cập nhật thông tin học viên (TraineeForm), các menu khác (Đơn hàng, Đối tác, Xuất cảnh) **không tự động cập nhật** dữ liệu vì:
1. **Orders**: Query key `order-trainee-counts` không được invalidate sau khi save trainee
2. **Partners**: Không có realtime invalidation → phải reload trang thủ công để cập nhật "Số HV"
3. **Post-Departure**: Query key `post-departure-trainees` không được invalidate khi `progression_stage` thay đổi

### Chi tiết từng thay đổi

#### File 1: `src/hooks/useSystemRealtime.ts` (Lines 60-82)
**Vấn đề hiện tại:** Khi trainee thay đổi, chỉ queue invalidation cho trainees, dashboard, education, dormitory. Thiếu Orders và Post-Departure.

**Thay đổi:**
- Thêm `queueInvalidation(REALTIME_GROUPS.ORDERS, QUERY_KEY_BUNDLES.orders, false)` sau line 73
  - Mục đích: Khi trainee thay đổi (progression_stage, receiving_company_id, v.v.), tự động refresh `order-trainee-counts` để hiển thị số ứng viên chính xác
- Thêm `queueInvalidation(REALTIME_GROUPS.POST_DEPARTURE, [...], false)` sau đó
  - Query keys cần invalidate: `["post-departure-trainees"]`, `["post-departure-stats-by-year"]`, `["post-departure-by-type"]`

**Lý do:** Các thay đổi này được cấu hình đầy đủ trong `QUERY_KEY_BUNDLES` (useRealtimeDebounce.ts), nhưng `REALTIME_GROUPS` chưa có `POST_DEPARTURE`.

---

#### File 2: `src/hooks/useRealtimeDebounce.ts` (Lines 132-209)
**Vấn đề:** Thiếu group `POST_DEPARTURE` trong `REALTIME_GROUPS`.

**Thay đổi:**
- Thêm vào `REALTIME_GROUPS` (line 132-139):
  ```typescript
  POST_DEPARTURE: 'post-departure',
  ```

- Thêm vào `QUERY_KEY_BUNDLES` (line 199 sau orders):
  ```typescript
  postDeparture: [
    ["post-departure-trainees"],
    ["post-departure-stats-by-year"],
    ["post-departure-by-type"],
    ["post-departure-kpi-cards"],
  ],
  ```

**Lý do:** Định nghĩa tập hợp query keys cho post-departure để tái sử dụng trong realtime invalidation.

---

#### File 3: `src/pages/TraineeForm.tsx` (Lines 875-883)
**Vấn đề hiện tại:**
```typescript
await queryClient.invalidateQueries({ queryKey: ["trainees"] });
// ... (chỉ invalidate trainees, không invalidate orders + post-departure)

toast({
  title: "Thành công",
  description: isEditMode ? "Đã cập nhật hồ sơ" : "Đã tạo hồ sơ mới",
});
```

**Thay đổi:** Mở rộng invalidation scope để bao gồm orders + post-departure:
```typescript
await queryClient.invalidateQueries({ queryKey: ["trainees"] });
await queryClient.invalidateQueries({ queryKey: ["order-trainee-counts"] });
await queryClient.invalidateQueries({ queryKey: ["post-departure-trainees"] });
await queryClient.invalidateQueries({ queryKey: ["post-departure-stats-by-year"] });
// Hoặc sử dụng QUERY_KEY_BUNDLES (cách tốt hơn):
QUERY_KEY_BUNDLES.orders.forEach(key => {
  await queryClient.invalidateQueries({ queryKey: key });
});
QUERY_KEY_BUNDLES.postDeparture.forEach(key => {
  await queryClient.invalidateQueries({ queryKey: key });
});
```

**Lý do:** Khi save trainee, cần refresh orders (vì receiving_company_id, progression_stage có thể thay đổi) và post-departure (vì progression_stage thay đổi).

---

#### File 4: `src/pages/partners/PartnerList.tsx` 
**Vấn đề hiện tại:** 
- Component sử dụng `useEffect` để tính toán "Số HV" dựa trên danh sách trainees
- Khi trainee thay đổi, component không biết được → phải reload trang thủ công
- Lý do là `useEffect` chỉ chạy khi component mount, không lắng nghe trainees updates

**Hai lựa chọn giải quyết:**

**Option A (Nhanh hơn - Recommended):** Thêm vào realtime invalidation trong `useSystemRealtime.ts`
- Khi trainees thay đổi, queue invalidation cho `["companies"]`, `["unions"]`, `["job_categories"]`
- PartnerList sẽ tự động refetch và recompute "Số HV"
- Không cần sửa PartnerList, chỉ sửa useSystemRealtime

**Option B (Cấu trúc tốt nhất - Khuyên dùng cho tương lai):** Tạo PostgreSQL View
- Tạo view `company_trainee_counts` trên Supabase
- View tính toán số học viên đã đậu PV (progression_stage != 'Chưa đậu') theo company_id
- PartnerList query trực tiếp từ view thay vì dùng useEffect
- Lợi điểm: Dữ liệu luôn chính xác, không cần recompute ở client, tối ưu cho quy mô lớn

**Chọn: Option A + kỹ thuật chuẩn bị Option B**
- Thêm invalidation `["companies"]`, `["unions"]` vào realtime handler khi trainees thay đổi
- Comment lại: "TODO: Chuyển sang PostgreSQL View công ty_learning_viên_counts để tối ưu hiệu suất"

---

### Tóm tắt chi tiết thay đổi

| File | Dòng | Thay đổi |
|------|------|---------|
| **useRealtimeDebounce.ts** | 139 | Thêm `POST_DEPARTURE: 'post-departure'` vào `REALTIME_GROUPS` |
| **useRealtimeDebounce.ts** | 209 | Thêm bundle `postDeparture: [...]` vào `QUERY_KEY_BUNDLES` |
| **useSystemRealtime.ts** | 73-82 | Thêm `queueInvalidation` cho ORDERS và POST_DEPARTURE khi trainees thay đổi |
| **useSystemRealtime.ts** | 310-315 | Thêm `["company-trainee-counts"]`, `["union-trainee-counts"]` vào refreshPartners() |
| **TraineeForm.tsx** | 875-883 | Thêm invalidation cho `order-trainee-counts` + `post-departure-*` queries sau save |

---

### Mô hình hóa luồng sau triển khai

```text
Người dùng cập nhật trainee (TraineeForm)
         ↓
   [Bấm Lưu]
         ↓
  Update trainees table
         ↓
Realtime trigger → useSystemRealtime.ts:
  - Invalidate TRAINEES queries
  - Invalidate DASHBOARD queries
  - Invalidate EDUCATION queries
  - Invalidate DORMITORY queries
  - [NEW] Invalidate ORDERS queries ← order-trainee-counts refresh
  - [NEW] Invalidate POST_DEPARTURE queries ← post-departure-trainees refresh
  - [NEW] Invalidate PARTNERS queries ← companies/unions refresh
         ↓
Dashboard, Orders, Partners, Post-Departure tự động cập nhật
         ↓
React Query refetch → UI re-render
```

---

### Tiêu chí nghiệm thu (E2E Testing)

1. **Test Orders:**
   - Vào TraineeForm → chọn một đơn hàng (receiving_company_id)
   - Bấm Lưu → vào menu Đơn hàng
   - Xác nhận: Số lượng ứng viên của đơn hàng đó cập nhật tức thì (không cần reload)

2. **Test Partners:**
   - Vào TraineeForm → cập nhật receiving_company_id
   - Bấm Lưu → vào menu Đối tác → tab Công ty
   - Xác nhận: Cột "Số HV" của công ty đó cập nhật tức thì

3. **Test Post-Departure:**
   - Vào TraineeForm → cập nhật progression_stage thành "Xuất cảnh" + departure_date
   - Bấm Lưu → vào menu Sau xuất cảnh
   - Xác nhận: Số liệu KPI "Thực tập sinh", "TTS số 3" v.v. cập nhật tức thì, không cần reload

4. **Test Dashboard:**
   - Tạo học viên mới
   - Bấm Lưu → vào Dashboard
   - Xác nhận: KPI "Học viên đang đào tạo", "Học viên hiện tại" cập nhật tức thì

---

### Lưu ý kỹ thuật

1. **Debounce Logic:** Tất cả invalidations vẫn tuân thủ debounce 500ms từ `useRealtimeDebounce`, tránh query storm
2. **Manual Refresh:** `useManualRefresh().refreshAll()` đã cover hết, không cần sửa
3. **Partners View (Future):** Nên xem xét tạo PostgreSQL View để thay thế useEffect, tối ưu hóa cho quy mô hàng triệu trainees
