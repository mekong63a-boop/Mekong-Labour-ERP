

## Fix loi "phai thao tac 2 lan moi luu duoc" trong menu Hoc vien

### Nguyen nhan goc

Sau khi kiem tra toan bo TraineeForm.tsx va cac component lien quan, toi phat hien **3 nguyen nhan chinh** gay ra loi phai thao tac 2 lan:

---

### Van de 1: Tab Du an & Phong van - Ngay phong van khong luu

**Nguyen nhan**: `projectInterviewData` duoc dong bo tu `trainee` va `interviewData` nhung co co `projectLoaded` chi chay 1 lan. Neu `interviewData` load SAU `trainee`, ngay phong van se bi trong. Ngoai ra, khi TAO MOI hoc vien, `traineeId` la `undefined` nen nut "Luu lich su phong van" khong hien thi, va ham `saveHistoryItems` chi luu draft fields (company, union...) nhung KHONG goi `finalize_interview_draft` de luu ngay phong van.

**Cach fix**:
- Bo co `projectLoaded` - thay bang logic dong bo dung: chi cap nhat khi du lieu thay doi thuc su
- Trong `saveHistoryItems`, neu co `interview_date` thi tu dong goi `finalize_interview_draft` RPC de luu luon lich su phong van (khong bat buoc nguoi dung bam nut rieng)
- Voi hoc vien moi: sau khi tao xong, goi finalize voi traineeId moi

---

### Van de 2: Tab Trang thai - Simple status va Progression stage khong luu

**Nguyen nhan**: `useEffect` tai dong 369-452 chay moi khi `trainee` thay doi (tu optimistic update hoac refetch). Khi nguoi dung thay doi trang thai roi bam Luu:
1. `updateTraineeMutation` fire optimistic update → cache `trainee` cap nhat
2. `useEffect([isEditMode, trainee])` fire → RESET `formData` tu cache
3. Server response ve → `onSuccess` cap nhat cache THEM 1 lan
4. `useEffect` fire LAN NUA → co the reset ve du lieu cu neu co race condition

Ngoai ra, `useUpdateTrainee` su dung optimistic update voi `setQueryData`, nhung `TraineeForm.handleSubmit` cung goi `invalidateQueries` + `refetchQueries`. Dieu nay tao ra nhieu lan re-render khong can thiet va co the gay ra race condition.

**Cach fix**:
- Them co `formLoaded` tuong tu `educationLoaded` de ngan useEffect re-run sau khi nguoi dung da bat dau chinh sua
- Reset co `formLoaded` chi khi traineeId thay doi (navigate sang hoc vien khac)
- Loai bo viec goi `refetchQueries` cho `["trainee", traineeId]` trong handleSubmit vi optimistic update da xu ly

---

### Van de 3: Lich su lam viec va cac tab khac

**Nguyen nhan tuong tu**: Cac co `workLoaded`, `educationLoaded` hoat dong dung cho lan load dau tien, nhung sau khi luu va invalidate queries, du lieu moi duoc fetch ve va useEffect chay lai voi co van la `true` nen khong cap nhat. Tuy nhien, do nguoi dung da thao tac tren local state nen van de nay it xay ra hon 2 van de tren.

---

### Chi tiet ky thuat

#### File: `src/pages/TraineeForm.tsx`

**1. Them co `formLoaded` de ngan useEffect reset form:**

```typescript
const [formLoaded, setFormLoaded] = useState(false);

// Reset khi traineeId thay doi
useEffect(() => {
  setFormLoaded(false);
  setProjectLoaded(false);
  setEducationLoaded(false);
  setWorkLoaded(false);
  setFamilyLoaded(false);
  setJapanLoaded(false);
}, [traineeId]);

// Populate form - chi chay 1 lan
useEffect(() => {
  if (isEditMode && trainee && !formLoaded) {
    setFormData({...});
    setFormLoaded(true);
  }
}, [isEditMode, trainee, formLoaded]);
```

**2. Fix dong bo projectInterviewData:**

```typescript
useEffect(() => {
  if (trainee && interviewData !== undefined && !projectLoaded) {
    setProjectInterviewData({
      order_id: "",
      interview_date: interviewData?.[0]?.interview_date || "",
      expected_entry_month: trainee.expected_entry_month || "",
      receiving_company_id: trainee.receiving_company_id || "",
      union_id: trainee.union_id || "",
      job_category_id: trainee.job_category_id || "",
      contract_term: trainee.contract_term ? String(trainee.contract_term) : "",
    });
    setProjectLoaded(true);
  }
}, [trainee, interviewData, projectLoaded]);
```

Diem quan trong: them dieu kien `interviewData !== undefined` de dam bao du lieu phong van da load xong truoc khi set `projectLoaded = true`.

**3. Tu dong luu interview history khi save form:**

Trong ham `saveHistoryItems`, them logic:

```typescript
// Neu co interview_date, tu dong finalize vao lich su
if (projectInterviewData.interview_date) {
  const { error: intErr } = await supabase.rpc("finalize_interview_draft", {
    p_trainee_id: traineeId,
    p_interview_date: projectInterviewData.interview_date,
    p_result: null,
    p_company_id: projectInterviewData.receiving_company_id || null,
    p_union_id: projectInterviewData.union_id || null,
    p_job_category_id: projectInterviewData.job_category_id || null,
    p_expected_entry_month: projectInterviewData.expected_entry_month || null,
  });
  if (intErr) throw intErr;
}
```

**4. Don dep invalidation logic trong handleSubmit:**

Loai bo `refetchQueries` cho `["trainee", traineeId]` de tranh xung dot voi optimistic update. Chi giu `invalidateQueries` cho cac query list.

---

### Cac file can chinh sua

| File | Thay doi |
|------|----------|
| `src/pages/TraineeForm.tsx` | Them `formLoaded`, fix projectLoaded sync, tu dong finalize interview, don dep cache logic |

Khong can thay doi database hay tao migration moi.

