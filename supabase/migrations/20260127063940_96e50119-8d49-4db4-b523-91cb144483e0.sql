-- Add hearing and hepatitis_b fields to trainees table
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS hearing TEXT,
ADD COLUMN IF NOT EXISTS hepatitis_b TEXT;