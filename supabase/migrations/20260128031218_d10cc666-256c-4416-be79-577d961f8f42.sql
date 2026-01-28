-- Add manual input columns for high school and JP certificate
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS high_school_name TEXT,
ADD COLUMN IF NOT EXISTS high_school_period TEXT,
ADD COLUMN IF NOT EXISTS jp_certificate_school TEXT,
ADD COLUMN IF NOT EXISTS jp_certificate_period TEXT;