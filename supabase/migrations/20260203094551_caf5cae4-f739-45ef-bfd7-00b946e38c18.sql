-- Thêm cột nơi cấp hộ chiếu vào bảng trainees
ALTER TABLE public.trainees ADD COLUMN IF NOT EXISTS passport_place TEXT;