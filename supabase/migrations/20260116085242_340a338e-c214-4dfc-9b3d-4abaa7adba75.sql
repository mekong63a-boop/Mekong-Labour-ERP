-- Thêm cột mô tả hình xăm vào bảng trainees
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS tattoo_description TEXT;