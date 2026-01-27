
-- ============================================================
-- BƯỚC 0: DỌN DẸP DỮ LIỆU KHÔNG HỢP LỆ TRƯỚC KHI THÊM FK
-- ============================================================

-- Xóa class_id không hợp lệ (class đã bị xóa)
UPDATE public.trainees
SET class_id = NULL
WHERE class_id IS NOT NULL 
  AND class_id NOT IN (SELECT id FROM public.classes);

-- ============================================================
-- BƯỚC 1: THÊM FOREIGN KEYS CHO CÁC BẢNG CHÍNH
-- ============================================================

-- trainees -> classes
ALTER TABLE public.trainees
  ADD CONSTRAINT fk_trainees_class
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- trainees -> companies (receiving_company_id)
ALTER TABLE public.trainees
  ADD CONSTRAINT fk_trainees_company
  FOREIGN KEY (receiving_company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- trainees -> unions
ALTER TABLE public.trainees
  ADD CONSTRAINT fk_trainees_union
  FOREIGN KEY (union_id) REFERENCES public.unions(id) ON DELETE SET NULL;

-- trainees -> job_categories
ALTER TABLE public.trainees
  ADD CONSTRAINT fk_trainees_job_category
  FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id) ON DELETE SET NULL;

-- interview_history -> companies
ALTER TABLE public.interview_history
  ADD CONSTRAINT fk_interview_company
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- interview_history -> unions
ALTER TABLE public.interview_history
  ADD CONSTRAINT fk_interview_union
  FOREIGN KEY (union_id) REFERENCES public.unions(id) ON DELETE SET NULL;

-- interview_history -> job_categories
ALTER TABLE public.interview_history
  ADD CONSTRAINT fk_interview_job_category
  FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id) ON DELETE SET NULL;

-- orders -> companies
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_company
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- orders -> unions
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_union
  FOREIGN KEY (union_id) REFERENCES public.unions(id) ON DELETE SET NULL;

-- orders -> job_categories
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_job_category
  FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id) ON DELETE SET NULL;

-- ============================================================
-- BƯỚC 2: XÓA CÁC BẢNG KHÔNG SỬ DỤNG (rỗng và không cần thiết)
-- ============================================================

-- Xóa bảng user_permissions (trùng với user_menu_permissions)
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- Xóa bảng edit_permissions (không sử dụng)
DROP TABLE IF EXISTS public.edit_permissions CASCADE;

-- Xóa bảng department_menu_permissions (rỗng, logic dùng user_menu_permissions)
DROP TABLE IF EXISTS public.department_menu_permissions CASCADE;

-- ============================================================
-- BƯỚC 3: XÓA CÁC VIEWS THỪA
-- ============================================================

-- Xóa views trùng lặp hoặc không sử dụng
DROP VIEW IF EXISTS public.trainees_basic CASCADE;
DROP VIEW IF EXISTS public.dashboard_trainee_by_status CASCADE;
DROP VIEW IF EXISTS public.trainee_workflow_counts CASCADE;

-- ============================================================
-- BƯỚC 4: THÊM COMMENT ĐỂ GHI CHÚ LOGIC
-- ============================================================

COMMENT ON TABLE public.trainees IS 'Bảng chính lưu thông tin học viên - Single Source of Truth';
COMMENT ON TABLE public.interview_history IS 'Lịch sử phỏng vấn - lưu thông tin placement (công ty, nghiệp đoàn) khi đậu';
COMMENT ON TABLE public.trainee_workflow IS 'Workflow trạng thái học viên - 1:1 với trainees';
COMMENT ON TABLE public.orders IS 'Đơn tuyển dụng từ công ty - nguồn yêu cầu tuyển dụng';
