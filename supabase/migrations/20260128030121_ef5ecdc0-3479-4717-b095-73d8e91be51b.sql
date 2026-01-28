-- Add new legal document fields to trainees table
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS legal_address_vn TEXT,
ADD COLUMN IF NOT EXISTS legal_address_jp TEXT,
ADD COLUMN IF NOT EXISTS guarantor_name_vn TEXT,
ADD COLUMN IF NOT EXISTS guarantor_name_jp TEXT,
ADD COLUMN IF NOT EXISTS guarantor_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.trainees.legal_address_vn IS 'Vietnamese address for legal documents';
COMMENT ON COLUMN public.trainees.legal_address_jp IS 'Japanese address for legal documents';
COMMENT ON COLUMN public.trainees.guarantor_name_vn IS 'Guarantor name in Vietnamese';
COMMENT ON COLUMN public.trainees.guarantor_name_jp IS 'Guarantor name in Japanese';
COMMENT ON COLUMN public.trainees.guarantor_phone IS 'Guarantor phone number';