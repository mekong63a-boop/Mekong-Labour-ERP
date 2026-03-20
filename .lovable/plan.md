

## Sửa logic lọc năm "TTS đang ở Nhật" — KPI tính đúng học viên từ năm trước

### Vấn đề
`isTraineeRelevantToYear` chỉ check `startsWith(year)` → bỏ sót HV xuất cảnh năm trước nhưng vẫn đang ở Nhật.

### Thay đổi — 1 file duy nhất: `src/pages/post-departure/PostDeparturePage.tsx`

**1. Sửa `isTraineeRelevantToYear` (dòng 235-242)**
```typescript
// HV liên quan đến năm Y nếu:
// - Đã xuất cảnh trước hoặc trong năm Y (departure_date <= Y-12-31)
// - VÀ chưa rời Nhật trước năm Y (exit_date >= Y-01-01 hoặc chưa có exit)
const yearStart = `${year}-01-01`;
const yearEnd = `${year}-12-31`;
if (!trainee.departure_date || trainee.departure_date > yearEnd) return false;
const exitDate = trainee.absconded_date || trainee.early_return_date || trainee.return_date;
if (exitDate && exitDate < yearStart) return false;
return true;
```

**2. Sửa `getYearOptionsFromData` (dòng 111-122)**
Thêm tất cả năm từ năm xuất cảnh đến năm hiện tại (hoặc năm rời Nhật) để dropdown đầy đủ.

**3. Sửa `typeStats` (dòng 158-159)**
Thay `startsWith(selectedYear)` bằng `isTraineeRelevantToYear` để đồng bộ với KPI.

### Không ảnh hưởng
- Không thay đổi database, migration, hay API
- Logic `getDisplayStatusForYear` giữ nguyên (đã đúng)
- Chỉ thay đổi cách lọc danh sách, không ảnh hưởng hiệu năng

