-- Drop existing policies first
drop policy if exists "passport_places_insert_staff" on public.passport_places;
drop policy if exists "passport_places_update_staff" on public.passport_places;
drop policy if exists "passport_places_delete_manager" on public.passport_places;

-- 1. INSERT: authenticated + is_staff_or_higher
create policy "passport_places_insert_staff"
on public.passport_places
for insert
to authenticated
with check (is_staff_or_higher(auth.uid()));

-- 2. UPDATE: authenticated + is_staff_or_higher
create policy "passport_places_update_staff"
on public.passport_places
for update
to authenticated
using (is_staff_or_higher(auth.uid()));

-- 3. DELETE: authenticated + is_manager_or_higher
create policy "passport_places_delete_manager"
on public.passport_places
for delete
to authenticated
using (is_manager_or_higher(auth.uid()));