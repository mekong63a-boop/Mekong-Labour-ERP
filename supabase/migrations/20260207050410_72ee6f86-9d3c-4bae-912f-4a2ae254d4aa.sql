-- Thêm 2 columns mới để lưu trữ mã hồ sơ cho tab thống kê
-- Mã HS ĐKHĐ: Mã hồ sơ đăng ký hợp đồng lao động cư trú
-- Mã HS xin TPC: Mã hồ sơ xin thư phái cử

ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS dkhd_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tpc_code TEXT DEFAULT NULL;

-- Thêm comment để mô tả cột
COMMENT ON COLUMN public.trainees.dkhd_code IS 'Mã hồ sơ ĐKHĐ - nhiều học viên cùng mã = 1 phiếu trả lời';
COMMENT ON COLUMN public.trainees.tpc_code IS 'Mã hồ sơ xin TPC - nhiều học viên cùng mã = 1 thư phái cử';