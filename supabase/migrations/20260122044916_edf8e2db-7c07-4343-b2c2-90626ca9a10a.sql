-- Add transfer_reason column to dormitory_residents
ALTER TABLE public.dormitory_residents 
ADD COLUMN IF NOT EXISTS transfer_reason TEXT;

-- Add from_dormitory_id to track where trainee transferred from
ALTER TABLE public.dormitory_residents 
ADD COLUMN IF NOT EXISTS from_dormitory_id UUID REFERENCES public.dormitories(id) ON DELETE SET NULL;