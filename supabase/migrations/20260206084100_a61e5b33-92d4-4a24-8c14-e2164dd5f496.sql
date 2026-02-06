-- Thêm trường "Đã từng xin tư cách lưu trú" (Previous residence status application)
-- prior_residence_status: Tư cách đã xin trước đó (tiếng Nhật)
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS prior_residence_status TEXT;