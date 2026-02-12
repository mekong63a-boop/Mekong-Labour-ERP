

## Yeu cau 1: Hien thi ngay tuong ung theo trang thai trong menu Sau xuat canh

### Hien trang
Bang danh sach hien tai co cot "Ngay ve nuoc" dung chung cho tat ca trang thai. Cot nay chi hien thi `return_date` (Hoan thanh HD) hoac `early_return_date` (Ve truoc han), nhung **khong hien thi `absconded_date`** cho tab Bo tron. Ngoai ra, query `usePostDepartureTrainees` khong select truong `absconded_date`.

### Giai phap
1. Them `absconded_date` vao query select (dong 66-67 PostDeparturePage.tsx)
2. Doi cot "Ngay ve nuoc" thanh cot dong theo `progression_stage`:
   - **Bo tron**: hien thi `absconded_date` voi nhan "Ngay bo tron" (badge mau do)
   - **Ve truoc han**: hien thi `early_return_date` voi nhan "Ngay ve"
   - **Hoan thanh hop dong**: hien thi `return_date` voi nhan "Ngay ve nuoc"
   - **Dang lam viec / Xuat canh**: hien thi "-"

### File thay doi
- `src/pages/post-departure/PostDeparturePage.tsx`: Them `absconded_date` vao query, cap nhat header va cell cua cot ngay

---

## Yeu cau 2: Khoa hoc vien - chi Admin chinh moi co quyen mo/khoa

### Hien trang
Chua co co che khoa hoc vien. Can tao cot moi trong database va logic bao ve tren ca backend (RLS) va frontend.

### Giai phap

**A. Database Migration:**

```sql
-- Them cot
ALTER TABLE public.trainees ADD COLUMN is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.trainees ADD COLUMN locked_at TIMESTAMPTZ;

-- Ham kiem tra Primary Admin (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_primary_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = 'admin' AND is_primary_admin = true
  );
$$;

-- Cap nhat RLS policy UPDATE: hoc vien bi khoa chi Primary Admin moi sua duoc
DROP POLICY IF EXISTS "trainees_update" ON public.trainees;
CREATE POLICY "trainees_update" ON public.trainees
  FOR UPDATE TO authenticated
  USING (
    can_update('trainees') AND (
      NOT is_locked OR is_primary_admin(auth.uid())
    )
  )
  WITH CHECK (
    can_update('trainees') AND (
      NOT is_locked OR is_primary_admin(auth.uid())
    )
  );
```

**B. Frontend - Danh sach hoc vien (`TraineeList.tsx`):**
- Them icon o khoa (Lock) ben canh ten hoc vien khi `is_locked = true`
- Them `is_locked` vao select query trong `useTraineesPaginated.ts`

**C. Frontend - Form chinh sua (`TraineeForm.tsx`):**
- Them nut Khoa/Mo khoa (chi hien thi cho Primary Admin, su dung `useUserRole().isPrimaryAdmin`)
- Khi hoc vien bi khoa:
  - Hien thi banner canh bao "Hoc vien da bi khoa boi Admin. Chi Admin chinh moi co the chinh sua."
  - An nut "Luu" cho nguoi khong phai Primary Admin
  - Disable tat ca input fields thong qua prop/CSS `pointer-events-none` + `opacity`

**D. Frontend - Trang xem chi tiet (`TraineeDetail.tsx`):**
- Hien thi badge "Da khoa" ben canh ten hoc vien

**E. Hook moi trong `useTrainees.ts`:**
- Them mutation `toggleTraineeLock(id, is_locked)` goi `supabase.from('trainees').update({ is_locked, locked_at })` 
- Chi Primary Admin moi goi duoc (RLS bao ve phia server)

### Dam bao quy tac

| Quy tac | Tuan thu |
|---------|----------|
| Single Source of Truth | `is_locked` chi nam trong bang `trainees`, khong duplicate |
| Brain (Supabase) vs Hands (Lovable) | Logic bao ve khoa nam trong RLS policy (Brain), UI chi hien thi |
| Khong pha UI | Chi them icon nho + banner, khong thay doi layout |
| Dong bo du lieu | `is_locked` duoc fetch cung voi du lieu hoc vien, khong can query rieng |

### Danh sach file thay doi

| File | Noi dung |
|------|----------|
| `supabase/migrations/xxx.sql` | Them cot `is_locked`, `locked_at`; tao ham `is_primary_admin`; cap nhat RLS |
| `src/pages/post-departure/PostDeparturePage.tsx` | Them `absconded_date` vao query; doi cot ngay theo trang thai |
| `src/hooks/useTraineesPaginated.ts` | Them `is_locked` vao select va interface `TraineeListItem` |
| `src/pages/TraineeList.tsx` | Hien thi icon khoa ben canh ten |
| `src/pages/TraineeForm.tsx` | Them nut khoa/mo khoa, banner, disable form khi bi khoa |
| `src/pages/TraineeDetail.tsx` | Hien thi badge khoa |
| `src/hooks/useTrainees.ts` | Them mutation `toggleTraineeLock` |

