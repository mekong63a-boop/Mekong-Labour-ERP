-- Xóa toàn bộ policy INSERT/UPDATE/DELETE cho passport_places
drop policy if exists "Authenticated can insert passport_places" on public.passport_places;
drop policy if exists "Authenticated can update passport_places" on public.passport_places;
drop policy if exists "Authenticated can delete passport_places" on public.passport_places;

-- Tạo policy mới với role-based access
create policy "passport_places_insert_staff"
on public.passport_places
for insert
to authenticated
with check (is_staff_or_higher(auth.uid()));

create policy "passport_places_update_staff"
on public.passport_places
for update
to authenticated
using (is_staff_or_higher(auth.uid()));

create policy "passport_places_delete_manager"
on public.passport_places
for delete
to authenticated
using (is_manager_or_higher(auth.uid()));