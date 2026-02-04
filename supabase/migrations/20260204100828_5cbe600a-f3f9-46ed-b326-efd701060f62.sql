-- Update master_trainee_stages to use exact stage codes matching the enum
-- First check if stages exist and update/insert accordingly

-- Delete old stages that don't match
DELETE FROM master_trainee_stages WHERE stage_code NOT IN (
  'registered', 'enrolled', 'training', 'interview_passed', 
  'document_processing', 'ready_to_depart', 'departed', 'post_departure', 'terminated'
);

-- Upsert the correct stages
INSERT INTO master_trainee_stages (stage_code, stage_name, stage_name_jp, order_index, ui_color, is_terminal, description)
VALUES 
  ('registered', 'Đăng ký', '登録済', 1, 'gray', false, 'Học viên mới đăng ký, chưa xếp lớp'),
  ('enrolled', 'Đã xếp lớp', '入学', 2, 'blue', false, 'Đã được xếp vào lớp học'),
  ('training', 'Đang đào tạo', '訓練中', 3, 'cyan', false, 'Đang trong quá trình đào tạo'),
  ('interview_passed', 'Đậu phỏng vấn', '面接合格', 4, 'green', false, 'Đã đậu phỏng vấn với doanh nghiệp'),
  ('document_processing', 'Xử lý hồ sơ', '書類処理中', 5, 'yellow', false, 'Đang xử lý hồ sơ VISA/COE'),
  ('ready_to_depart', 'Chờ xuất cảnh', '出国待ち', 6, 'orange', false, 'Đã có VISA, chờ xuất cảnh'),
  ('departed', 'Đã xuất cảnh', '出国済', 7, 'purple', false, 'Đã xuất cảnh sang Nhật'),
  ('post_departure', 'Sau xuất cảnh', '出国後', 8, 'indigo', false, 'Đang làm việc tại Nhật'),
  ('terminated', 'Kết thúc', '終了', 9, 'red', true, 'Đã kết thúc chương trình')
ON CONFLICT (stage_code) DO UPDATE SET
  stage_name = EXCLUDED.stage_name,
  stage_name_jp = EXCLUDED.stage_name_jp,
  order_index = EXCLUDED.order_index,
  ui_color = EXCLUDED.ui_color,
  is_terminal = EXCLUDED.is_terminal,
  description = EXCLUDED.description;

-- Update master_stage_transitions to use correct stage codes
DELETE FROM master_stage_transitions;

INSERT INTO master_stage_transitions (from_stage, to_stage, condition_description, requires_fields, auto_side_effects)
VALUES 
  -- From registered
  ('registered', 'enrolled', 'Khi xếp lớp', ARRAY['class_id'], ARRAY['auto_create_dormitory']),
  ('registered', 'terminated', 'Bỏ cuộc/Từ chối', NULL, NULL),
  
  -- From enrolled
  ('enrolled', 'training', 'Bắt đầu đào tạo', NULL, NULL),
  ('enrolled', 'terminated', 'Bỏ cuộc/Vi phạm', NULL, ARRAY['auto_checkout_dormitory']),
  
  -- From training
  ('training', 'interview_passed', 'Đậu phỏng vấn', ARRAY['receiving_company_id'], NULL),
  ('training', 'terminated', 'Bỏ cuộc/Vi phạm', NULL, ARRAY['auto_checkout_dormitory']),
  
  -- From interview_passed
  ('interview_passed', 'document_processing', 'Bắt đầu xử lý hồ sơ', NULL, NULL),
  ('interview_passed', 'training', 'Phỏng vấn lại', NULL, NULL),
  ('interview_passed', 'terminated', 'Bỏ cuộc/Vi phạm', NULL, ARRAY['auto_checkout_dormitory']),
  
  -- From document_processing
  ('document_processing', 'ready_to_depart', 'Có VISA', ARRAY['visa_date'], NULL),
  ('document_processing', 'terminated', 'Bỏ cuộc/Từ chối VISA', NULL, ARRAY['auto_checkout_dormitory']),
  
  -- From ready_to_depart
  ('ready_to_depart', 'departed', 'Xuất cảnh', ARRAY['departure_date'], ARRAY['auto_checkout_dormitory']),
  ('ready_to_depart', 'terminated', 'Bỏ cuộc', NULL, ARRAY['auto_checkout_dormitory']),
  
  -- From departed
  ('departed', 'post_departure', 'Theo dõi sau xuất cảnh', NULL, NULL),
  ('departed', 'terminated', 'Về nước sớm/Bỏ trốn', NULL, NULL),
  
  -- From post_departure
  ('post_departure', 'terminated', 'Hoàn thành/Về nước', NULL, NULL);