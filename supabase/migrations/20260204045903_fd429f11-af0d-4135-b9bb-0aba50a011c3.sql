-- Xoá các policies cũ còn sót trên trainees
DROP POLICY IF EXISTS "Manager+ can delete trainees" ON public.trainees;
DROP POLICY IF EXISTS "trainees_delete_by_menu_permission" ON public.trainees;
DROP POLICY IF EXISTS "trainees_insert_by_menu_permission" ON public.trainees;
DROP POLICY IF EXISTS "Staff+ can insert trainees" ON public.trainees;
DROP POLICY IF EXISTS "Staff+ can view trainees" ON public.trainees;
DROP POLICY IF EXISTS "trainees_select_by_menu_permission" ON public.trainees;
DROP POLICY IF EXISTS "Staff+ can update trainees" ON public.trainees;
DROP POLICY IF EXISTS "trainees_update_by_menu_permission" ON public.trainees;