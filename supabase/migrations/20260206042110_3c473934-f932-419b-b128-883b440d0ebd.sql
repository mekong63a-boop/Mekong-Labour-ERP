-- Thêm cột địa chỉ thường trú mới sau sáp nhập
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS permanent_address_new text;

-- Comment để giải thích
COMMENT ON COLUMN public.trainees.permanent_address IS 'Địa chỉ thường trú trước sáp nhập';
COMMENT ON COLUMN public.trainees.permanent_address_new IS 'Địa chỉ thường trú mới sau sáp nhập';