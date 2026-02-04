-- 1) Drop policy CRUD đang mở cho public
drop policy if exists "Authenticated can insert cccd_places" on public.cccd_places;
drop policy if exists "Authenticated can update cccd_places" on public.cccd_places;
drop policy if exists "Authenticated can delete cccd_places" on public.cccd_places;

-- 2) Tạo lại: chỉ staff+ (hoặc dùng can_* nếu bạn muốn)
create policy "cccd_places_insert_staff"
on public.cccd_places
for insert
to authenticated
with check (is_staff_or_higher(auth.uid()));

create policy "cccd_places_update_staff"
on public.cccd_places
for update
to authenticated
using (is_staff_or_higher(auth.uid()));

create policy "cccd_places_delete_manager"
on public.cccd_places
for delete
to authenticated
using (is_manager_or_higher(auth.uid()));