-- =====================================================
-- STATE MACHINE: MASTER TRAINEE STAGES
-- Single Source of Truth for all trainee status
-- =====================================================

-- 1. CREATE MASTER STAGES TABLE
CREATE TABLE IF NOT EXISTS public.master_trainee_stages (
    id SERIAL PRIMARY KEY,
    stage_code TEXT UNIQUE NOT NULL,
    stage_name TEXT NOT NULL,
    stage_name_jp TEXT,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_terminal BOOLEAN DEFAULT FALSE,
    ui_color TEXT DEFAULT 'gray',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INSERT STANDARD 9 STAGES
INSERT INTO public.master_trainee_stages (stage_code, stage_name, stage_name_jp, description, order_index, is_terminal, ui_color) VALUES
('registered', 'Đã đăng ký', '登録済み', 'Học viên mới đăng ký, chưa nhập học', 1, FALSE, 'slate'),
('enrolled', 'Đã nhập học', '入学済み', 'Đã gán lớp, bắt đầu học', 2, FALSE, 'blue'),
('training', 'Đang đào tạo', '訓練中', 'Đang trong quá trình đào tạo tiếng Nhật', 3, FALSE, 'cyan'),
('interview_passed', 'Đã đậu phỏng vấn', '面接合格', 'Đã pass phỏng vấn với công ty Nhật', 4, FALSE, 'green'),
('document_processing', 'Đang xử lý hồ sơ', '書類処理中', 'Đang làm visa, COE, giấy tờ xuất cảnh', 5, FALSE, 'amber'),
('ready_to_depart', 'Sẵn sàng xuất cảnh', '出国準備完了', 'Hồ sơ hoàn tất, chờ ngày bay', 6, FALSE, 'orange'),
('departed', 'Đã xuất cảnh', '出国済み', 'Đã bay sang Nhật', 7, FALSE, 'purple'),
('post_departure', 'Sau xuất cảnh', '出国後', 'Đang làm việc/sinh sống tại Nhật', 8, FALSE, 'indigo'),
('terminated', 'Kết thúc', '終了', 'Đã rời khỏi chương trình (bỏ cuộc/bị loại/hoàn thành)', 9, TRUE, 'red')
ON CONFLICT (stage_code) DO NOTHING;

-- 3. CREATE STAGE TRANSITIONS TABLE (allowed moves)
CREATE TABLE IF NOT EXISTS public.master_stage_transitions (
    id SERIAL PRIMARY KEY,
    from_stage TEXT NOT NULL REFERENCES public.master_trainee_stages(stage_code),
    to_stage TEXT NOT NULL REFERENCES public.master_trainee_stages(stage_code),
    condition_description TEXT,
    requires_fields TEXT[], -- Fields that must be filled
    auto_side_effects TEXT[], -- Actions to trigger
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_stage, to_stage)
);

-- 4. INSERT ALLOWED TRANSITIONS
INSERT INTO public.master_stage_transitions (from_stage, to_stage, condition_description, requires_fields, auto_side_effects) VALUES
-- Forward flow
('registered', 'enrolled', 'Gán lớp học', ARRAY['class_id'], ARRAY['create_dormitory_record']),
('registered', 'terminated', 'Bỏ cuộc trước nhập học', NULL, NULL),

('enrolled', 'training', 'Bắt đầu đào tạo', NULL, NULL),
('enrolled', 'terminated', 'Bỏ cuộc sau nhập học', NULL, ARRAY['checkout_dormitory']),

('training', 'interview_passed', 'Đậu phỏng vấn', ARRAY['receiving_company_id'], NULL),
('training', 'terminated', 'Bỏ cuộc/bị loại khi đào tạo', NULL, ARRAY['checkout_dormitory']),

('interview_passed', 'document_processing', 'Bắt đầu làm hồ sơ', NULL, NULL),
('interview_passed', 'training', 'Trở lại đào tạo (công ty hủy)', NULL, NULL),
('interview_passed', 'terminated', 'Bỏ cuộc sau đậu PV', NULL, ARRAY['checkout_dormitory']),

('document_processing', 'ready_to_depart', 'Hồ sơ hoàn tất', ARRAY['visa_date', 'coe_date'], NULL),
('document_processing', 'interview_passed', 'Quay lại (hồ sơ lỗi)', NULL, NULL),
('document_processing', 'terminated', 'Bỏ cuộc khi làm hồ sơ', NULL, ARRAY['checkout_dormitory']),

('ready_to_depart', 'departed', 'Xuất cảnh', ARRAY['departure_date'], ARRAY['checkout_dormitory']),
('ready_to_depart', 'document_processing', 'Hoãn xuất cảnh', NULL, NULL),
('ready_to_depart', 'terminated', 'Hủy xuất cảnh', NULL, ARRAY['checkout_dormitory']),

('departed', 'post_departure', 'Đã đến Nhật và bắt đầu làm việc', ARRAY['entry_date'], NULL),
('departed', 'terminated', 'Về nước sớm/bỏ trốn', NULL, NULL),

('post_departure', 'terminated', 'Kết thúc hợp đồng/về nước', NULL, NULL)

ON CONFLICT (from_stage, to_stage) DO NOTHING;

-- 5. SUB-STATUS FOR TERMINATED STAGE
CREATE TABLE IF NOT EXISTS public.master_terminated_reasons (
    id SERIAL PRIMARY KEY,
    reason_code TEXT UNIQUE NOT NULL,
    reason_name TEXT NOT NULL,
    reason_name_jp TEXT,
    description TEXT
);

INSERT INTO public.master_terminated_reasons (reason_code, reason_name, reason_name_jp, description) VALUES
('withdrawn', 'Tự rút lui', '自主退学', 'Học viên tự nguyện bỏ cuộc'),
('rejected', 'Bị loại', '不合格', 'Không đạt yêu cầu đào tạo hoặc phỏng vấn'),
('violation', 'Vi phạm', '規則違反', 'Vi phạm nội quy, kỷ luật'),
('medical', 'Lý do sức khỏe', '健康上の理由', 'Không đủ sức khỏe để tiếp tục'),
('family', 'Lý do gia đình', '家庭の事情', 'Hoàn cảnh gia đình không cho phép'),
('absconded', 'Bỏ trốn', '失踪', 'Bỏ trốn khỏi chương trình (tại Nhật)'),
('early_return', 'Về nước sớm', '早期帰国', 'Về nước trước khi hết hợp đồng'),
('contract_completed', 'Hoàn thành hợp đồng', '契約満了', 'Hoàn thành đầy đủ chương trình')
ON CONFLICT (reason_code) DO NOTHING;

-- 6. ENABLE RLS
ALTER TABLE public.master_trainee_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_terminated_reasons ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone authenticated can read (lookup tables)
CREATE POLICY "master_stages_read" ON public.master_trainee_stages FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "master_transitions_read" ON public.master_stage_transitions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "master_reasons_read" ON public.master_terminated_reasons FOR SELECT TO authenticated USING (TRUE);

-- Only admins can modify
CREATE POLICY "master_stages_admin" ON public.master_trainee_stages FOR ALL TO authenticated 
    USING (public.is_primary_admin_check(auth.uid()));
CREATE POLICY "master_transitions_admin" ON public.master_stage_transitions FOR ALL TO authenticated 
    USING (public.is_primary_admin_check(auth.uid()));
CREATE POLICY "master_reasons_admin" ON public.master_terminated_reasons FOR ALL TO authenticated 
    USING (public.is_primary_admin_check(auth.uid()));

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_current_stage ON public.trainee_workflow(current_stage);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_trainee_id ON public.trainee_workflow(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_history_trainee_id ON public.trainee_workflow_history(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_workflow_history_to_stage ON public.trainee_workflow_history(to_stage);
CREATE INDEX IF NOT EXISTS idx_trainees_class_id ON public.trainees(class_id);
CREATE INDEX IF NOT EXISTS idx_trainees_receiving_company ON public.trainees(receiving_company_id);
CREATE INDEX IF NOT EXISTS idx_dormitory_residents_trainee ON public.dormitory_residents(trainee_id);
CREATE INDEX IF NOT EXISTS idx_dormitory_residents_status ON public.dormitory_residents(status);