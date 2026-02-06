

## Mục tiêu
Triển khai mô hình **Draft → Finalize** cho **Project & Interview**, với các yêu cầu sau:
1. **Draft fields** sống trong bảng `trainees` (bao gồm `interview_date`)
2. Bấm nút **Lưu/Cập nhật thông tin** chỉ cập nhật draft, **không insert history**
3. **Lịch sử phỏng vấn** chỉ được ghi vào `interview_history` khi bấm **"Lưu lịch sử phỏng vấn"** (via RPC `finalize_interview_draft`)
4. Fix lỗi PostgREST embed (PGRST201) bằng cách chỉ rõ FK names
5. Thêm error UI khi query `interview_history` fail
6. Refetch queries sau khi finalize thành công

---

## Vấn đề hiện tại

### 1. Lỗi PostgREST Embed (PGRST201)
- File: `src/hooks/useTraineeHistory.ts`, line 18-22
- Nguyên nhân: Các FK từ `interview_history` → `companies`, `unions`, `job_categories` không được chỉ rõ, Supabase không biết FK nào cần dùng
- Hệ quả: Query fail → `data = undefined` → `ProjectInterviewTab` hiển thị "Chưa có lịch sử" thay vì hiển thị error

### 2. Ngày phỏng vấn không được lưu
- File: `src/pages/TraineeForm.tsx`, line 727-737 (`saveHistoryItems()`)
- Nguyên nhân:
  - Phần Project/Interview bị wrap trong `if (projectInterviewData.receiving_company_id || projectInterviewData.job_category_id)` → chỉ lưu nếu có company/job_category
  - **Không lưu `interview_date`** vào bảng `trainees`
  - Load draft từ `interviewData?.[0]?.interview_date` (history) thay vì `trainee.interview_date` (draft)

### 3. Số lần phỏng vấn luôn 0
- File: `src/components/trainees/tabs/ProjectInterviewTab.tsx`, line 135
- Hệ quả: `interviews.length = 0` vì query history fail (PGRST201)

### 4. Không có error state khi query history fail
- File: `src/hooks/useTraineeHistory.ts`, `ProjectInterviewTab.tsx`
- Nguyên nhân: Hook throw error nhưng UI không handle, chỉ show skeleton/empty state

---

## Giải pháp thiết kế

### A) Fix Hook useInterviewHistory (useTraineeHistory.ts)
Thay đổi embed select để chỉ rõ FK names:
```typescript
// TỪ:
select(`
  *,
  companies:company_id(id, name, name_japanese),
  unions:union_id(id, name, name_japanese),
  job_categories:job_category_id(id, name, name_japanese)
`)

// THÀNH:
select(`
  *,
  companies:companies!fk_interview_company(id, name, name_japanese),
  unions:unions!fk_interview_union(id, name, name_japanese),
  job_categories:job_categories!fk_interview_job_category(id, name, name_japanese)
`)
```

### B) Update ProjectInterviewTab để hiển thị error state
Thêm kiểm tra `error` từ hook và hiển thị message tương ứng:
```typescript
if (isLoading) → hiển thị skeleton
if (error) → hiển thị "Không tải được lịch sử" (thay vì "Chưa có lịch sử")
if (!interviews || interviews.length === 0) → hiển thị "Chưa có lịch sử"
```

### C) Update saveHistoryItems() để lưu interview_date draft
**Trong TraineeForm.tsx**, phần Project/Interview (line 727-737):
- **Bỏ điều kiện** `if (projectInterviewData.receiving_company_id || ...)`
- **Luôn update** `trainees` với tất cả draft fields, bao gồm:
  - `interview_date` (NEW)
  - `receiving_company_id`
  - `union_id`
  - `job_category_id`
  - `expected_entry_month`
  - `contract_term`
- **Không gọi RPC finalize** trong save này

### D) Update load project interview data
**Trong TraineeForm.tsx**, phần init data (line 498-513):
- Ưu tiên load `trainee.interview_date` (draft) từ bảng `trainees`
- Fallback sang `interviewData?.[0]?.interview_date` chỉ nếu draft rỗng (tuỳ chọn, để giữ "ngày gần nhất")

### E) Ensure query refetch sau finalize
**Trong ProjectInterviewForm.tsx**, `handleFinalizeInterview()` (line 76-79):
- Đã có logic refetch queries → ✅ không cần thay đổi
- Verify rằng refetch sau finalize successful

---

## Chi tiết triển khai

### File 1: `src/hooks/useTraineeHistory.ts`
**Dòng 18-22**: Thay select embed từ `company_id(...)` → `companies!fk_interview_company(...)`
- Làm tương tự cho `unions!fk_interview_union(...)` và `job_categories!fk_interview_job_category(...)`

**Thêm error state** (tuỳ chọn): Có thể refactor hook để return `{ data, error, isLoading }` để caller có thể handle error

### File 2: `src/components/trainees/tabs/ProjectInterviewTab.tsx`
**Dòng 32**: Destructure thêm `error` từ hook
```typescript
const { data: interviews, isLoading, error } = useInterviewHistory(trainee.id);
```

**Dòng 273-279**: Update conditional render:
```typescript
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : error ? (
  <p className="text-muted-foreground text-center py-8 text-red-600">
    Không tải được lịch sử phỏng vấn
  </p>
) : !interviews || interviews.length === 0 ? (
  <p className="text-muted-foreground text-center py-8">
    Chưa có lịch sử phỏng vấn
  </p>
) : (
  // ... render interviews
)}
```

### File 3: `src/pages/TraineeForm.tsx`

**Dòng 498-513** (init project interview data):
- Thay từ:
  ```typescript
  interview_date: interviewData?.[0]?.interview_date || "",
  ```
- Sang:
  ```typescript
  interview_date: trainee.interview_date || interviewData?.[0]?.interview_date || "",
  ```
- Ưu tiên `trainee.interview_date` (draft) trước, fallback sang history

**Dòng 727-737** (saveHistoryItems - Project/Interview):
- Bỏ điều kiện `if (projectInterviewData.receiving_company_id || projectInterviewData.job_category_id)`
- **Luôn update** trainees với tất cả fields:
  ```typescript
  await supabase.from("trainees").update({
    interview_date: projectInterviewData.interview_date || null,
    receiving_company_id: projectInterviewData.receiving_company_id || null,
    union_id: projectInterviewData.union_id || null,
    job_category_id: projectInterviewData.job_category_id || null,
    expected_entry_month: projectInterviewData.expected_entry_month || null,
    contract_term: projectInterviewData.contract_term ? parseFloat(projectInterviewData.contract_term) : null,
  }).eq("id", traineeId);
  ```

---

## Mô hình hóa luồng (sau triển khai)

```
DRAFT (user input) → [bấm Lưu] → trainees.interview_date + draft fields
                  ↓
        [bấm Lưu lịch sử phỏng vấn] → finalize_interview_draft RPC
                  ↓
        insert interview_history + update interview_count (trigger)
```

---

## Tiêu chí nghiệm thu (E2E test)
1. Vào edit trainee → tab **Dự án & Phỏng vấn**
2. Nhập **Ngày phỏng vấn** (đơn giản, không chọn order)
3. Bấm **Lưu/Cập nhật thông tin** → ngày phỏng vấn lưu được
4. Reload trang → ngày phỏng vấn vẫn còn (lấy từ `trainees.interview_date`)
5. Bấm **Lưu lịch sử phỏng vấn** → lịch sử xuất hiện 1 dòng, "Số lần phỏng vấn" = 1
6. Reload lại → lịch sử vẫn là 1 (không bị lặp)
7. Test error state: (tuỳ chọn) tạm disable FK constraint để trigger PGRST201 → UI hiển thị "Không tải được..."

---

## Tóm tắt thay đổi
| File | Dòng | Thay đổi |
|------|------|---------|
| `useTraineeHistory.ts` | 20-22 | Fix embed FK name: `!fk_interview_company`, `!fk_interview_union`, `!fk_interview_job_category` |
| `ProjectInterviewTab.tsx` | 32 | Destructure `error` từ hook |
| `ProjectInterviewTab.tsx` | 273-279 | Thêm error state rendering |
| `TraineeForm.tsx` | 504 | Ưu tiên load `trainee.interview_date` |
| `TraineeForm.tsx` | 727-737 | Bỏ `if` condition, luôn update draft, thêm `interview_date` |

