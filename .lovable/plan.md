

## Nguyên nhân gốc

RPC `finalize_interview_draft` **luôn INSERT** mới, không kiểm tra bản ghi đã tồn tại. Kết quả:

- Nút "Lưu lịch sử phỏng vấn" trong `ProjectInterviewForm` → gọi RPC → INSERT 1 bản ghi
- Nút "Lưu" chính trong `TraineeForm` → cũng gọi RPC → INSERT thêm 1 bản ghi nữa
- Mỗi lần bấm Lưu = thêm 1 bản ghi trùng

DB hiện có 3 cặp trùng lặp, trong đó học viên 006700 có **4 bản ghi cùng ngày 26/11/2024**.

## Giải pháp

### 1. Migration SQL — sửa RPC thành UPSERT + dọn trùng

**a) Thêm UNIQUE constraint** trên `(trainee_id, interview_date)` — đảm bảo mỗi học viên chỉ có 1 bản ghi cho mỗi ngày phỏng vấn.

**b) Dọn dữ liệu trùng trước** — giữ lại bản ghi có nhiều thông tin nhất (ưu tiên có company_id), xóa các bản trùng.

**c) Sửa RPC `finalize_interview_draft`** — dùng `ON CONFLICT (trainee_id, interview_date) DO UPDATE` thay vì INSERT thuần:

```sql
INSERT INTO interview_history (trainee_id, company_id, union_id, ...)
VALUES (...)
ON CONFLICT (trainee_id, interview_date)
DO UPDATE SET
  company_id = COALESCE(EXCLUDED.company_id, interview_history.company_id),
  union_id = COALESCE(EXCLUDED.union_id, interview_history.union_id),
  ...
RETURNING id;
```

### 2. Không thay đổi frontend

- `ProjectInterviewForm.tsx` — giữ nguyên
- `TraineeForm.tsx` — giữ nguyên
- Cả 2 nơi gọi RPC đều an toàn vì RPC giờ là UPSERT, bấm bao nhiêu lần cũng chỉ có 1 bản ghi duy nhất

### File thay đổi

| File | Nội dung |
|------|---------|
| Migration SQL | Dọn trùng + thêm UNIQUE constraint + sửa RPC thành UPSERT |

