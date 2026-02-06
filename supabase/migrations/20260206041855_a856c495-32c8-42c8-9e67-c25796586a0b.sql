-- Thêm trường mối quan hệ cho SĐT phụ huynh và SĐT phụ huynh 3
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS parent_phone_1_relation text,
ADD COLUMN IF NOT EXISTS parent_phone_2_relation text,
ADD COLUMN IF NOT EXISTS parent_phone_3 text,
ADD COLUMN IF NOT EXISTS parent_phone_3_relation text;