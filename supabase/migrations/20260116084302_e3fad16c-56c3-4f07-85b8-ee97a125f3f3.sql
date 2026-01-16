-- 1. Tạo bảng danh sách Diện chính sách
CREATE TABLE IF NOT EXISTS public.policy_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policy_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for policy_categories
CREATE POLICY "policy_categories_select" ON public.policy_categories
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "policy_categories_insert" ON public.policy_categories
  FOR INSERT WITH CHECK (is_staff_or_higher(auth.uid()));

CREATE POLICY "policy_categories_update" ON public.policy_categories
  FOR UPDATE USING (is_staff_or_higher(auth.uid()));

CREATE POLICY "policy_categories_delete" ON public.policy_categories
  FOR DELETE USING (is_admin(auth.uid()));

-- Insert default values for Diện chính sách
INSERT INTO public.policy_categories (name) VALUES 
  ('Bộ đội'),
  ('Hộ nghèo'),
  ('Cận nghèo'),
  ('Gia đình có công'),
  ('Hộ bị thu hồi đất')
ON CONFLICT (name) DO NOTHING;

-- 2. Tạo bảng danh sách Tôn giáo
CREATE TABLE IF NOT EXISTS public.religions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.religions ENABLE ROW LEVEL SECURITY;

-- RLS policies for religions
CREATE POLICY "religions_select" ON public.religions
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "religions_insert" ON public.religions
  FOR INSERT WITH CHECK (is_staff_or_higher(auth.uid()));

CREATE POLICY "religions_update" ON public.religions
  FOR UPDATE USING (is_staff_or_higher(auth.uid()));

CREATE POLICY "religions_delete" ON public.religions
  FOR DELETE USING (is_admin(auth.uid()));

-- Insert default values for Tôn giáo
INSERT INTO public.religions (name) VALUES 
  ('Không'),
  ('Phật giáo'),
  ('Công giáo'),
  ('Tin lành'),
  ('Cao đài'),
  ('Hòa hảo'),
  ('Hồi giáo'),
  ('Khác')
ON CONFLICT (name) DO NOTHING;

-- 3. Thêm 2 cột mới vào bảng trainees
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS policy_category TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT NULL;