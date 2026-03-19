

## Sửa hiển thị trạng thái giáo viên trong bảng

### Nguyên nhân

Cột trạng thái trong bảng (dòng 317-322) kiểm tra `teacher.status === "active"` → nếu không phải "active" thì hiển thị "Ngừng". Nhưng popup chỉnh sửa lưu giá trị tiếng Việt: "Đang làm việc", "Nghỉ phép", "Đã nghỉ". Hai nơi không khớp nhau → bảng luôn hiển thị "Ngừng" cho mọi trạng thái không phải "active".

### Giải pháp

Sửa logic hiển thị Badge trong bảng (dòng 314-323) để dùng đúng giá trị tiếng Việt khớp với popup:

| Giá trị DB | Badge hiển thị | Màu |
|---|---|---|
| `Đang làm việc` | Đang làm việc | Xanh lá |
| `Nghỉ phép` | Nghỉ phép | Vàng |
| `Đã nghỉ` | Đã nghỉ | Xám |

### Phạm vi
- **1 file**: `src/pages/education/TeacherList.tsx` — sửa phần Badge render (dòng 314-323)

