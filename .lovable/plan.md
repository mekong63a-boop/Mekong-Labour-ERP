

## Kiem tra va thong nhat 1 luong, 1 nguon du lieu cho toan du an

### Ket qua kiem tra

He thong hien tai **DA** tuan thu tot nguyen tac Single Source of Truth o muc kien truc:
- Tat ca du lieu doc tu bang `trainees` (Supabase)
- Dashboard dung PostgreSQL Views (pre-computed)
- Phan quyen thong nhat qua `has_menu_permission` RPC
- Stage counts dung DB view `trainee_stage_counts`
- Optimistic updates + cache invalidation dong bo

### Van de can xu ly

| # | Van de | File | Muc do |
|---|--------|------|--------|
| 1 | `useTrainees()` load **TOAN BO** bang trainees (select *) khong LIMIT - ham nay khong ai goi nhung van ton tai, gay nham lan va co the bi goi nham trong tuong lai | `src/hooks/useTrainees.ts` | Cao |
| 2 | `DashboardDetailList.tsx` inline query load toan bo trainees khong LIMIT, khong phan trang | `src/pages/dashboard/DashboardDetailList.tsx` | Cao |
| 3 | `useEducation.ts` inline query `select("class_id, simple_status").not("class_id", "is", null)` load toan bo trainees de dem si so - nen dung DB view | `src/hooks/useEducation.ts` | Trung binh |
| 4 | Thieu index `audit_logs.record_id` va GIN trigram cho `trainee_code`, `birthplace` | Database | Cao |

### Ke hoach thuc hien

**Buoc 1: Migration - Them index**
```sql
-- Index cho audit_logs.record_id (bang lon nhat)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- GIN trigram indexes cho search ilike
CREATE INDEX IF NOT EXISTS idx_trainees_trainee_code_trgm ON trainees USING gin (trainee_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trainees_birthplace_trgm ON trainees USING gin (birthplace gin_trgm_ops);
```

**Buoc 2: Xoa `useTrainees()` va `useTraineesRealtime()` - thay bang `useTraineesPaginated`**

File `src/hooks/useTrainees.ts`:
- Xoa ham `useTrainees()` (dong 24-40) va `useTraineesRealtime()` (dong 14-17)
- Giu lai: `useTrainee()`, `useUpdateTrainee()`, `useDeleteTrainee()`, `useToggleTraineeLock()`
- Xoa optimistic update cho queryKey `["trainees"]` trong `useUpdateTrainee` va `useDeleteTrainee` (vi khong con query nao dung key do)

**Buoc 3: Fix `DashboardDetailList.tsx` - them LIMIT**

Them `.limit(5000)` vao query inline (dong 130-157) de bao ve khi data lon. Day la trang detail list nen can xem nhieu nhung van can gioi han.

**Buoc 4: Cap nhat `useSystemRealtime.ts`**

Xoa `invalidateQueries({ queryKey: ["trainees"] })` va `refetchQueries({ queryKey: ["trainees"] })` trong ham `refreshTrainees()` vi khong con query nao dung key do.

### File thay doi

| File | Noi dung |
|------|---------|
| Migration SQL | Them 3 index (audit_logs.record_id, trainee_code trgm, birthplace trgm) |
| `src/hooks/useTrainees.ts` | Xoa `useTrainees()` + `useTraineesRealtime()`, don dep optimistic update |
| `src/pages/dashboard/DashboardDetailList.tsx` | Them `.limit(5000)` |
| `src/hooks/useSystemRealtime.ts` | Xoa invalidate queryKey `["trainees"]` |

