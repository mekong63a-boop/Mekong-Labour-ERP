
-- ============================================================
-- AUTO-SYNC simple_status FROM progression_stage (Semi-automatic)
-- Mapping: progression_stage → simple_status
-- Manual overrides preserved for: BaoLuu, Huy, KhongHoc
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_sync_simple_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when progression_stage actually changes
  IF OLD.progression_stage IS DISTINCT FROM NEW.progression_stage THEN
    CASE NEW.progression_stage::text
      WHEN 'ChuaDau' THEN
        NEW.simple_status := 'DangKyMoi'::simple_status;
      WHEN 'DaoTao' THEN
        NEW.simple_status := 'DangHoc'::simple_status;
      WHEN 'DauPV' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'NopHS' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'OTIT' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'Nyukan' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'COE' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'Visa' THEN
        NEW.simple_status := 'DaDau'::simple_status;
      WHEN 'DaXuatCanh' THEN
        NEW.simple_status := 'DangONhat'::simple_status;
      WHEN 'DangLamViec' THEN
        NEW.simple_status := 'DangONhat'::simple_status;
      WHEN 'BoTron' THEN
        NEW.simple_status := 'DungChuongTrinh'::simple_status;
      WHEN 'VeNuocSom' THEN
        NEW.simple_status := 'RoiCongTy'::simple_status;
      WHEN 'HoanThanhHD' THEN
        NEW.simple_status := 'RoiCongTy'::simple_status;
      ELSE
        -- Unknown stage: don't change simple_status
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_sync_simple_status ON public.trainees;

-- Create trigger BEFORE UPDATE (so it modifies NEW before write)
CREATE TRIGGER trg_auto_sync_simple_status
  BEFORE UPDATE ON public.trainees
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_simple_status();

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_sync_simple_status() IS 
'Semi-automatic sync: When progression_stage changes, auto-update simple_status. 
Manual overrides for BaoLuu/Huy/KhongHoc are preserved (user can still set simple_status directly without changing progression_stage).';
