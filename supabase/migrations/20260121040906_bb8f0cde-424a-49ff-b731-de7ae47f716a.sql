-- Create dormitories table for dormitory management
CREATE TABLE public.dormitories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  capacity INTEGER DEFAULT 20,
  status TEXT DEFAULT 'Đang hoạt động',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dormitory_residents table for tracking trainees in dormitories
CREATE TABLE public.dormitory_residents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dormitory_id UUID NOT NULL REFERENCES public.dormitories(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date DATE,
  room_number TEXT,
  bed_number TEXT,
  status TEXT DEFAULT 'Đang ở',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dormitory_id, trainee_id, check_in_date)
);

-- Add indexes for better performance
CREATE INDEX idx_dormitory_residents_dormitory ON public.dormitory_residents(dormitory_id);
CREATE INDEX idx_dormitory_residents_trainee ON public.dormitory_residents(trainee_id);
CREATE INDEX idx_dormitory_residents_status ON public.dormitory_residents(status);

-- Enable RLS
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormitory_residents ENABLE ROW LEVEL SECURITY;

-- RLS policies for dormitories
CREATE POLICY "dormitories_select" ON public.dormitories
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "dormitories_insert" ON public.dormitories
  FOR INSERT WITH CHECK (can_insert('dormitory'));

CREATE POLICY "dormitories_update" ON public.dormitories
  FOR UPDATE USING (can_update('dormitory')) WITH CHECK (can_update('dormitory'));

CREATE POLICY "dormitories_delete" ON public.dormitories
  FOR DELETE USING (can_delete('dormitory'));

-- RLS policies for dormitory_residents
CREATE POLICY "dormitory_residents_select" ON public.dormitory_residents
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "dormitory_residents_insert" ON public.dormitory_residents
  FOR INSERT WITH CHECK (can_insert('dormitory'));

CREATE POLICY "dormitory_residents_update" ON public.dormitory_residents
  FOR UPDATE USING (can_update('dormitory')) WITH CHECK (can_update('dormitory'));

CREATE POLICY "dormitory_residents_delete" ON public.dormitory_residents
  FOR DELETE USING (can_delete('dormitory'));

-- Trigger for updated_at
CREATE TRIGGER update_dormitories_updated_at
  BEFORE UPDATE ON public.dormitories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dormitory_residents_updated_at
  BEFORE UPDATE ON public.dormitory_residents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();