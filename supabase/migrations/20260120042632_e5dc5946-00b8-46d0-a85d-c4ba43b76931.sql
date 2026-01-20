-- Fix 1: Thêm SET search_path cho function ensure_single_manager_per_department
-- Giữ nguyên logic, chỉ thêm security setting

CREATE OR REPLACE FUNCTION public.ensure_single_manager_per_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Nếu đang cập nhật thành manager
  IF NEW.role_in_department = 'manager' THEN
    -- Kiểm tra xem đã có manager khác trong phòng ban này chưa
    IF EXISTS (
      SELECT 1 FROM public.department_members
      WHERE department = NEW.department
        AND role_in_department = 'manager'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Phòng ban này đã có trưởng phòng. Mỗi phòng ban chỉ được có một trưởng phòng.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;