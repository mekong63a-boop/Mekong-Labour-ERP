-- Create enrollment_history table to track class changes, teacher changes, etc.
CREATE TABLE public.enrollment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'Nhập học', 'Chuyển lớp', 'Đổi giáo viên', 'Tốt nghiệp', 'Bảo lưu', 'Xuất cảnh', 'Về nước', etc.
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrollment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users on enrollment_history"
ON public.enrollment_history FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users on enrollment_history"
ON public.enrollment_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on enrollment_history"
ON public.enrollment_history FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on enrollment_history"
ON public.enrollment_history FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_enrollment_history_trainee ON public.enrollment_history(trainee_id);
CREATE INDEX idx_enrollment_history_class ON public.enrollment_history(class_id);
CREATE INDEX idx_enrollment_history_date ON public.enrollment_history(action_date DESC);