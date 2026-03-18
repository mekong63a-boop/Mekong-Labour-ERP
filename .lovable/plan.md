

## Kế hoạch bổ sung 3 tính năng cho vận hành 20 năm

### Hiện trạng

1. **Validation**: Chỉ validate 5 trường (mã, tên, ngày sinh, nguồn, giới tính). CCCD/Passport/SĐT không validate format.
2. **Audit Log**: Hook `useAuditLog` tồn tại nhưng chỉ dùng ở `DepartmentsContent.tsx`. TraineeForm không ghi audit log khi tạo/sửa.
3. **Validation trường quan trọng**: Không validate format dữ liệu, nhập "abc" vào CCCD vẫn lưu được.

---

### 1. Validate format CCCD / Passport / SĐT (client-side)

Thêm validation vào `handleSubmit` trong `TraineeForm.tsx`:

| Trường | Regex | Quy tắc |
|--------|-------|---------|
| CCCD (`cccd_number`) | `/^\d{12}$/` | Đúng 12 chữ số |
| Passport (`passport_number`) | `/^[A-Z]\d{7,8}$/` | 1 chữ cái + 7-8 số |
| SĐT (`phone`) | `/^0\d{9}$/` | 10 chữ số, bắt đầu bằng 0 |

- Chỉ validate khi trường có giá trị (không bắt buộc nhập, nhưng nếu nhập thì phải đúng format)
- Hiển thị toast lỗi cụ thể: "CCCD phải gồm 12 chữ số"

### 2. Audit Log khi tạo/sửa trainee

Trong `handleSubmit` của `TraineeForm.tsx`:

- **Tạo mới**: Gọi `logAudit('INSERT', 'trainees', newId, null, traineeData, 'Thêm mới học viên: {tên}')`
- **Cập nhật**: Lưu `oldData` từ `trainee` query trước khi update, gọi `logAudit('UPDATE', 'trainees', id, oldData, newData, 'Cập nhật học viên: {tên}')`
- Import `useAuditLog` và `generateAuditDescription` đã có sẵn

### 3. Mở rộng validation trường quan trọng

Thêm validate cho các trường có ảnh hưởng nghiệp vụ (nếu đã nhập):

| Trường | Validate |
|--------|---------|
| `email` | Regex email cơ bản |
| `height` | Số 100-250 |
| `weight` | Số 20-200 |
| `vision_left/right` | Số 0.0-3.0 |
| `birth_date` | Không được trong tương lai |
| `registration_date` | Không được trong tương lai |

---

### Phạm vi thay đổi

- **Chỉ sửa 1 file**: `src/pages/TraineeForm.tsx`
  - Thêm `import { useAuditLog, generateAuditDescription }` 
  - Thêm hàm `validateFormats()` trước logic save
  - Thêm `logAudit()` sau INSERT/UPDATE thành công
- **Không tạo migration** — validation hoàn toàn client-side
- **Không sửa file khác**

