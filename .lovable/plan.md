

## Lỗi: View `post_departure_stats_by_year` nhóm theo `departure_date` cho tất cả trạng thái

### Nguyên nhân

View `post_departure_stats_by_year` nhóm **tất cả** trạng thái theo năm `departure_date`. Học viên 006692 xuất cảnh năm **2024** nhưng bỏ trốn ngày **09/02/2026**. Khi lọc năm 2026, view đếm học viên này ở năm 2024 → năm 2026 hiển thị "Bỏ trốn = 0".

**Tương tự cho**: "Về trước hạn" dùng `early_return_date`, "Hoàn thành HĐ" dùng `return_date` — đều bị nhóm sai theo `departure_date`.

### Giải pháp

Sửa view `post_departure_stats_by_year` để mỗi trạng thái được nhóm theo **ngày sự kiện thực tế**:

| Trạng thái | Nhóm theo |
|---|---|
| Đang làm việc / Xuất cảnh | `departure_date` (đúng rồi) |
| Bỏ trốn | `absconded_date` (thay vì departure_date) |
| Về trước hạn | `early_return_date` (thay vì departure_date) |
| Hoàn thành hợp đồng | `return_date` (thay vì departure_date) |

Cách triển khai: dùng `UNION ALL` của 4 sub-queries, mỗi query nhóm theo ngày tương ứng, rồi aggregate lại theo năm.

```sql
CREATE OR REPLACE VIEW post_departure_stats_by_year AS
WITH combined AS (
  -- Đang ở Nhật: nhóm theo departure_date
  SELECT EXTRACT(year FROM departure_date)::text AS year,
    1 AS working, 0 AS early_return, 0 AS absconded, 0 AS completed
  FROM trainees
  WHERE departure_date IS NOT NULL
    AND progression_stage IN ('Đang làm việc', 'Xuất cảnh')

  UNION ALL
  -- Bỏ trốn: nhóm theo absconded_date
  SELECT EXTRACT(year FROM COALESCE(absconded_date, departure_date))::text,
    0, 0, 1, 0
  FROM trainees
  WHERE progression_stage = 'Bỏ trốn'
    AND COALESCE(absconded_date, departure_date) IS NOT NULL

  UNION ALL
  -- Về trước hạn: nhóm theo early_return_date
  SELECT EXTRACT(year FROM COALESCE(early_return_date, departure_date))::text,
    0, 1, 0, 0
  FROM trainees
  WHERE progression_stage = 'Về trước hạn'
    AND COALESCE(early_return_date, departure_date) IS NOT NULL

  UNION ALL
  -- Hoàn thành HĐ: nhóm theo return_date
  SELECT EXTRACT(year FROM COALESCE(return_date, departure_date))::text,
    0, 0, 0, 1
  FROM trainees
  WHERE progression_stage = 'Hoàn thành hợp đồng'
    AND COALESCE(return_date, departure_date) IS NOT NULL
)
SELECT year,
  SUM(working)::integer AS working,
  SUM(early_return)::integer AS early_return,
  SUM(absconded)::integer AS absconded,
  SUM(completed)::integer AS completed,
  COUNT(*)::integer AS total
FROM combined
GROUP BY year
ORDER BY year;
```

Đồng thời cần cập nhật **cách lọc danh sách** trong frontend (`PostDeparturePage.tsx` dòng 265-269): khi lọc năm cho trạng thái "Bỏ trốn" thì dùng `absconded_date`, "Về trước hạn" dùng `early_return_date`, "Hoàn thành HĐ" dùng `return_date` thay vì chỉ dùng `departure_date`.

### File thay đổi

| File | Nội dung |
|------|---------|
| Migration SQL | `CREATE OR REPLACE VIEW post_departure_stats_by_year` với UNION ALL logic |
| `src/pages/post-departure/PostDeparturePage.tsx` | Sửa filter năm (dòng 265-269) dùng event date thay vì chỉ departure_date |

### Không thay đổi

Tất cả các phần khác giữ nguyên: KPI cards, chart, export, trainee type filter, search.

