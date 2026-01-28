-- Add JP school columns for legal tracking
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS jp_school_1 TEXT,
ADD COLUMN IF NOT EXISTS jp_course_1 TEXT,
ADD COLUMN IF NOT EXISTS jp_school_2 TEXT,
ADD COLUMN IF NOT EXISTS jp_course_2 TEXT;