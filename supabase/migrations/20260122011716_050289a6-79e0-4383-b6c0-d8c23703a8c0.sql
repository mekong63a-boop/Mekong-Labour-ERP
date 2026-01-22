-- Add Line QR code URL field and clothing sizes to trainees table
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS line_qr_url TEXT,
ADD COLUMN IF NOT EXISTS pants_size TEXT,
ADD COLUMN IF NOT EXISTS shirt_size TEXT,
ADD COLUMN IF NOT EXISTS shoe_size TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.trainees.line_qr_url IS 'Line QR code image URL';
COMMENT ON COLUMN public.trainees.pants_size IS 'Pants/trousers size';
COMMENT ON COLUMN public.trainees.shirt_size IS 'Shirt/top size';
COMMENT ON COLUMN public.trainees.shoe_size IS 'Shoe size';