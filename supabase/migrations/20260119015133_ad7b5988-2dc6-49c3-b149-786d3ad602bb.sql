-- =====================================================
-- PHASE 1: TẠO BẢNG DEPARTMENTS (chưa tồn tại)
-- =====================================================

-- 1. Tạo bảng departments master
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_japanese TEXT,
  parent_id UUID REFERENCES public.departments(id),
  manager_id UUID, -- FK to profiles.user_id (sẽ add sau)
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, archived
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index cho departments
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);

-- 3. Trigger updated_at cho departments
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS cho departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies cho departments
CREATE POLICY "Authenticated users can view active departments"
  ON departments FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admin can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. Insert dữ liệu phòng ban mặc định
INSERT INTO departments (code, name, name_japanese, order_index) VALUES
  ('recruitment', 'Phòng Tuyển dụng', '採用部', 1),
  ('training', 'Phòng Đào tạo', '教育部', 2),
  ('dormitory', 'Phòng Ký túc xá', '寮管理部', 3),
  ('legal', 'Phòng Pháp lý', '法務部', 4),
  ('dispatch', 'Phòng Xuất cảnh', '派遣部', 5),
  ('post_departure', 'Phòng Hậu xuất cảnh', 'アフターケア部', 6),
  ('accounting', 'Phòng Kế toán', '経理部', 7)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PHASE 2: TRAINEE WORKFLOW - CORE DATA MODEL
-- =====================================================

-- 7. Tạo ENUM chuẩn cho workflow stages
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trainee_workflow_stage') THEN
    CREATE TYPE public.trainee_workflow_stage AS ENUM (
      'recruited',        -- Mới tuyển dụng
      'trained',          -- Đang đào tạo
      'dormitory',        -- Ở KTX chờ xuất cảnh
      'visa_processing',  -- Đang xử lý visa
      'ready_to_depart',  -- Sẵn sàng xuất cảnh
      'departed',         -- Đã xuất cảnh
      'post_departure',   -- Hậu xuất cảnh (đang ở Nhật)
      'archived'          -- Lưu trữ (về nước, bỏ trốn, etc.)
    );
  END IF;
END $$;

-- 8. Tạo bảng trainee_workflow
CREATE TABLE IF NOT EXISTS public.trainee_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  current_stage trainee_workflow_stage NOT NULL DEFAULT 'recruited',
  sub_status TEXT,
  owner_department_id UUID REFERENCES public.departments(id),
  notes TEXT,
  transitioned_at TIMESTAMPTZ DEFAULT now(),
  transitioned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trainee_workflow UNIQUE (trainee_id)
);

-- 9. Tạo bảng lịch sử workflow (immutable)
CREATE TABLE IF NOT EXISTS public.trainee_workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  from_stage trainee_workflow_stage,
  to_stage trainee_workflow_stage NOT NULL,
  sub_status TEXT,
  owner_department_id UUID REFERENCES public.departments(id),
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_trainee_id ON trainee_workflow(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_stage ON trainee_workflow(current_stage);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_department ON trainee_workflow(owner_department_id);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_history_trainee ON trainee_workflow_history(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_history_created ON trainee_workflow_history(created_at DESC);

-- 11. Trigger updated_at
DROP TRIGGER IF EXISTS update_trainee_workflow_updated_at ON trainee_workflow;
CREATE TRIGGER update_trainee_workflow_updated_at
  BEFORE UPDATE ON trainee_workflow
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Function ghi lịch sử transition
CREATE OR REPLACE FUNCTION public.log_workflow_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    INSERT INTO trainee_workflow_history (
      trainee_id, from_stage, to_stage, sub_status, 
      owner_department_id, changed_by, reason
    ) VALUES (
      NEW.trainee_id, OLD.current_stage, NEW.current_stage, NEW.sub_status,
      NEW.owner_department_id, auth.uid(), NEW.notes
    );
    
    NEW.transitioned_at := now();
    NEW.transitioned_by := auth.uid();
    
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, description)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'WORKFLOW_TRANSITION',
      'trainee_workflow',
      NEW.id::TEXT,
      jsonb_build_object('stage', OLD.current_stage, 'sub_status', OLD.sub_status),
      jsonb_build_object('stage', NEW.current_stage, 'sub_status', NEW.sub_status),
      'Chuyển trạng thái: ' || OLD.current_stage || ' → ' || NEW.current_stage
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 13. Trigger cho transition
DROP TRIGGER IF EXISTS trigger_workflow_transition ON trainee_workflow;
CREATE TRIGGER trigger_workflow_transition
  BEFORE UPDATE ON trainee_workflow
  FOR EACH ROW
  EXECUTE FUNCTION log_workflow_transition();

-- 14. Enable RLS
ALTER TABLE trainee_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainee_workflow_history ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies cho trainee_workflow
CREATE POLICY "Staff can view workflow"
  ON trainee_workflow FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.is_manager_or_higher(auth.uid()) OR
    public.is_staff_or_higher(auth.uid()) OR
    public.is_teacher_or_higher(auth.uid())
  );

CREATE POLICY "Manager can insert workflow"
  ON trainee_workflow FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    public.is_manager_or_higher(auth.uid())
  );

CREATE POLICY "Authorized can update workflow"
  ON trainee_workflow FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.is_manager_or_higher(auth.uid()) OR
    public.is_staff_or_higher(auth.uid())
  );

-- 16. RLS cho workflow_history (read-only)
CREATE POLICY "Staff can view workflow history"
  ON trainee_workflow_history FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.is_manager_or_higher(auth.uid()) OR
    public.is_staff_or_higher(auth.uid())
  );

-- 17. Function chuyển stage
CREATE OR REPLACE FUNCTION public.transition_trainee_stage(
  _trainee_id UUID,
  _new_stage trainee_workflow_stage,
  _sub_status TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.is_manager_or_higher(auth.uid()) OR
    public.is_staff_or_higher(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Không có quyền chuyển trạng thái';
  END IF;

  UPDATE trainee_workflow
  SET 
    current_stage = _new_stage,
    sub_status = _sub_status,
    notes = _notes,
    updated_at = now()
  WHERE trainee_id = _trainee_id;
  
  IF NOT FOUND THEN
    INSERT INTO trainee_workflow (trainee_id, current_stage, sub_status, notes)
    VALUES (_trainee_id, _new_stage, _sub_status, _notes);
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 18. Function helper lấy workflow
CREATE OR REPLACE FUNCTION public.get_trainee_workflow(_trainee_id UUID)
RETURNS TABLE (
  id UUID,
  current_stage trainee_workflow_stage,
  sub_status TEXT,
  owner_department_id UUID,
  transitioned_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, current_stage, sub_status, owner_department_id, transitioned_at
  FROM trainee_workflow
  WHERE trainee_id = _trainee_id;
$$;