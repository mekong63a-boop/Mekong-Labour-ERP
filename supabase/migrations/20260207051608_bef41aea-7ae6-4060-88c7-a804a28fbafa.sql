-- Add ptl_date column to trainees table for tracking PTL approval date
ALTER TABLE public.trainees ADD COLUMN IF NOT EXISTS ptl_date date;