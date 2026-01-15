-- Add class_start_date and class_end_date columns to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS class_start_date date,
ADD COLUMN IF NOT EXISTS class_end_date date;