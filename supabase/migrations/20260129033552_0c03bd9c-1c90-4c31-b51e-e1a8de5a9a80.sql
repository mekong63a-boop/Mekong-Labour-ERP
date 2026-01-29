-- Thêm cột ngành nghề cho công ty (không liên quan tới bảng job_categories)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS industry TEXT;