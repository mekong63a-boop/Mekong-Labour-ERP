-- =====================================================
-- TASK 1: DATABASE EXPANSION FOR MEKONG LABOUR HUB
-- =====================================================

-- Add Personal Information Fields
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS birthplace TEXT,
ADD COLUMN IF NOT EXISTS cccd_number TEXT,
ADD COLUMN IF NOT EXISTS cccd_date DATE,
ADD COLUMN IF NOT EXISTS cccd_place TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS passport_date DATE,
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS current_situation TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT;

-- Add Address & Contact Fields
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS temp_address TEXT,
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS household_address TEXT,
ADD COLUMN IF NOT EXISTS parent_phone_1 TEXT,
ADD COLUMN IF NOT EXISTS parent_phone_2 TEXT;

-- Add Health Information Fields
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS vision_left NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS vision_right NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS dominant_hand TEXT,
ADD COLUMN IF NOT EXISTS smoking TEXT,
ADD COLUMN IF NOT EXISTS tattoo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS drinking TEXT,
ADD COLUMN IF NOT EXISTS health_status TEXT,
ADD COLUMN IF NOT EXISTS hobbies TEXT;

-- Add Process & Class Fields
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS class_id UUID,
ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'Chưa nhập học',
ADD COLUMN IF NOT EXISTS interview_pass_date DATE,
ADD COLUMN IF NOT EXISTS receiving_company_id UUID,
ADD COLUMN IF NOT EXISTS union_id UUID,
ADD COLUMN IF NOT EXISTS job_category_id UUID,
ADD COLUMN IF NOT EXISTS interview_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;

-- Add Milestone Dates
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS document_submission_date DATE,
ADD COLUMN IF NOT EXISTS otit_entry_date DATE,
ADD COLUMN IF NOT EXISTS nyukan_entry_date DATE,
ADD COLUMN IF NOT EXISTS coe_date DATE,
ADD COLUMN IF NOT EXISTS visa_date DATE,
ADD COLUMN IF NOT EXISTS absconded_date DATE,
ADD COLUMN IF NOT EXISTS early_return_date DATE,
ADD COLUMN IF NOT EXISTS early_return_reason TEXT,
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Add Contract Calculation Fields
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS contract_term INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS expected_return_date DATE;

-- Add Photo URL
ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =====================================================
-- Create Supporting Tables
-- =====================================================

-- Create companies table (Công ty tiếp nhận)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_japanese TEXT,
    address TEXT,
    work_address TEXT,
    representative TEXT,
    position TEXT,
    email TEXT,
    phone TEXT,
    country TEXT DEFAULT 'Nhật Bản',
    status TEXT DEFAULT 'Đang hợp tác',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on companies"
ON public.companies FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on companies"
ON public.companies FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on companies"
ON public.companies FOR UPDATE USING (true) WITH CHECK (true);

-- Create unions table (Nghiệp đoàn quản lý)
CREATE TABLE IF NOT EXISTS public.unions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_japanese TEXT,
    address TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    country TEXT DEFAULT 'Nhật Bản',
    status TEXT DEFAULT 'Đang hợp tác',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.unions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on unions"
ON public.unions FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on unions"
ON public.unions FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on unions"
ON public.unions FOR UPDATE USING (true) WITH CHECK (true);

-- Create job_categories table (Ngành nghề)
CREATE TABLE IF NOT EXISTS public.job_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_japanese TEXT,
    category TEXT DEFAULT 'Khác',
    description TEXT,
    status TEXT DEFAULT 'Hoạt động',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on job_categories"
ON public.job_categories FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on job_categories"
ON public.job_categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on job_categories"
ON public.job_categories FOR UPDATE USING (true) WITH CHECK (true);

-- Create classes table (Lớp học)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    level TEXT DEFAULT 'N5',
    target_audience TEXT DEFAULT 'Khác',
    max_students INTEGER DEFAULT 60,
    schedule TEXT,
    start_date DATE,
    expected_end_date DATE,
    status TEXT DEFAULT 'Đang hoạt động',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on classes"
ON public.classes FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on classes"
ON public.classes FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on classes"
ON public.classes FOR UPDATE USING (true) WITH CHECK (true);

-- Create teachers table (Giáo viên)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Đang làm việc',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on teachers"
ON public.teachers FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on teachers"
ON public.teachers FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on teachers"
ON public.teachers FOR UPDATE USING (true) WITH CHECK (true);

-- Create class_teachers junction table
CREATE TABLE IF NOT EXISTS public.class_teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Giáo viên chính',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(class_id, teacher_id)
);

ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on class_teachers"
ON public.class_teachers FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on class_teachers"
ON public.class_teachers FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on class_teachers"
ON public.class_teachers FOR DELETE USING (true);

-- Create attendance table (Điểm danh)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trainee_id, class_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on attendance"
ON public.attendance FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on attendance"
ON public.attendance FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on attendance"
ON public.attendance FOR UPDATE USING (true) WITH CHECK (true);

-- Create interview_history table (Lịch sử phỏng vấn)
CREATE TABLE IF NOT EXISTS public.interview_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    union_id UUID REFERENCES public.unions(id),
    job_category_id UUID REFERENCES public.job_categories(id),
    interview_date DATE,
    result TEXT,
    expected_entry_month TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on interview_history"
ON public.interview_history FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on interview_history"
ON public.interview_history FOR INSERT WITH CHECK (true);

-- Create orders table (Đơn hàng)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id),
    union_id UUID REFERENCES public.unions(id),
    job_category_id UUID REFERENCES public.job_categories(id),
    work_address TEXT,
    quantity INTEGER DEFAULT 1,
    contract_term INTEGER DEFAULT 3,
    gender_requirement TEXT DEFAULT 'Cả hai',
    expected_interview_date DATE,
    status TEXT DEFAULT 'Đang tuyển',
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on orders"
ON public.orders FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on orders"
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on orders"
ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Create education_history table (Quá trình học tập)
CREATE TABLE IF NOT EXISTS public.education_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    level TEXT,
    major TEXT,
    start_year INTEGER,
    end_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.education_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on education_history"
ON public.education_history FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on education_history"
ON public.education_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on education_history"
ON public.education_history FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on education_history"
ON public.education_history FOR DELETE USING (true);

-- Create work_history table (Quá trình làm việc)
CREATE TABLE IF NOT EXISTS public.work_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    position TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on work_history"
ON public.work_history FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on work_history"
ON public.work_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on work_history"
ON public.work_history FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on work_history"
ON public.work_history FOR DELETE USING (true);

-- Create family_members table (Mối quan hệ gia đình)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    gender TEXT,
    full_name TEXT NOT NULL,
    birth_year INTEGER,
    location TEXT,
    occupation TEXT,
    income TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on family_members"
ON public.family_members FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on family_members"
ON public.family_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on family_members"
ON public.family_members FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on family_members"
ON public.family_members FOR DELETE USING (true);

-- Create japan_relatives table (Người thân tại Nhật)
CREATE TABLE IF NOT EXISTS public.japan_relatives (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT,
    age INTEGER,
    gender TEXT,
    address_japan TEXT,
    residence_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.japan_relatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on japan_relatives"
ON public.japan_relatives FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on japan_relatives"
ON public.japan_relatives FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on japan_relatives"
ON public.japan_relatives FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on japan_relatives"
ON public.japan_relatives FOR DELETE USING (true);

-- =====================================================
-- Create function to auto-calculate expected_return_date
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_expected_return_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.departure_date IS NOT NULL AND NEW.contract_term IS NOT NULL THEN
        NEW.expected_return_date := NEW.departure_date + (NEW.contract_term * INTERVAL '1 year');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-calculating expected_return_date
DROP TRIGGER IF EXISTS trigger_calculate_return_date ON public.trainees;
CREATE TRIGGER trigger_calculate_return_date
    BEFORE INSERT OR UPDATE OF departure_date, contract_term ON public.trainees
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_expected_return_date();

-- =====================================================
-- Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unions_updated_at
    BEFORE UPDATE ON public.unions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_categories_updated_at
    BEFORE UPDATE ON public.job_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();