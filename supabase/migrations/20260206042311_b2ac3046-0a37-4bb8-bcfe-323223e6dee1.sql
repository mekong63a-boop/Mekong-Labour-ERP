-- Thêm các cột ngày cho trạng thái đặc biệt
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS reserve_date date,
ADD COLUMN IF NOT EXISTS stop_date date,
ADD COLUMN IF NOT EXISTS cancel_date date;

-- Comment giải thích
COMMENT ON COLUMN public.trainees.reserve_date IS 'Ngày bảo lưu';
COMMENT ON COLUMN public.trainees.stop_date IS 'Ngày dừng chương trình';
COMMENT ON COLUMN public.trainees.cancel_date IS 'Ngày hủy';