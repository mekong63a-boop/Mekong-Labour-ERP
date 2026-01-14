-- Create vocabulary dictionary table (Từ vựng)
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vietnamese TEXT NOT NULL,
  japanese TEXT NOT NULL,
  category TEXT DEFAULT 'Chung',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create katakana mapping table (Tên Việt → Katakana)
CREATE TABLE public.katakana_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vietnamese_name TEXT NOT NULL,
  katakana TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral sources table (Nguồn giới thiệu)
CREATE TABLE public.referral_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katakana_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for vocabulary (allow all operations for now)
CREATE POLICY "Allow all operations on vocabulary" ON public.vocabulary FOR ALL USING (true) WITH CHECK (true);

-- Create policies for katakana_names
CREATE POLICY "Allow all operations on katakana_names" ON public.katakana_names FOR ALL USING (true) WITH CHECK (true);

-- Create policies for referral_sources
CREATE POLICY "Allow all operations on referral_sources" ON public.referral_sources FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better search performance
CREATE INDEX idx_vocabulary_vietnamese ON public.vocabulary USING GIN (to_tsvector('simple', vietnamese));
CREATE INDEX idx_vocabulary_category ON public.vocabulary(category);
CREATE INDEX idx_katakana_vietnamese ON public.katakana_names(vietnamese_name);
CREATE INDEX idx_referral_sources_name ON public.referral_sources(name);