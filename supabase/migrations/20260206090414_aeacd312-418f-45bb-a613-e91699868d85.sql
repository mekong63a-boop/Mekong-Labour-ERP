-- Add income column to work_history table for trainee work history income tracking
ALTER TABLE public.work_history ADD COLUMN IF NOT EXISTS income TEXT;