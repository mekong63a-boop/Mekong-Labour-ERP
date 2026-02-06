-- Thêm transitions cho phép từ 'terminated' đến các giai đoạn khác
-- Cho phép phục hồi học viên đã dừng chương trình

INSERT INTO public.master_stage_transitions (from_stage, to_stage, condition_description, requires_fields, auto_side_effects)
VALUES 
  -- Quay lại từ đầu
  ('terminated', 'registered', 'Phục hồi - Làm lại từ đầu', NULL, '{"reset_departure_fields"}'),
  
  -- Đã nhập học (cần có lớp)
  ('terminated', 'enrolled', 'Phục hồi - Nhập học lại', ARRAY['class_id'], '{"create_ktx_pending", "reset_departure_fields"}'),
  
  -- Đang đào tạo
  ('terminated', 'training', 'Phục hồi - Tiếp tục đào tạo', ARRAY['class_id'], '{"create_ktx_pending", "reset_departure_fields"}'),
  
  -- Đậu phỏng vấn
  ('terminated', 'interview_passed', 'Phục hồi - Đã đậu phỏng vấn', ARRAY['receiving_company_id'], '{"create_ktx_pending", "reset_departure_fields"}'),
  
  -- Đang xử lý hồ sơ
  ('terminated', 'document_processing', 'Phục hồi - Xử lý hồ sơ', ARRAY['receiving_company_id'], '{"create_ktx_pending", "reset_departure_fields"}'),
  
  -- Sẵn sàng xuất cảnh
  ('terminated', 'ready_to_depart', 'Phục hồi - Sẵn sàng xuất cảnh', ARRAY['receiving_company_id', 'visa_date', 'coe_date'], '{"create_ktx_pending", "reset_departure_fields"}'),
  
  -- Đã xuất cảnh
  ('terminated', 'departed', 'Phục hồi - Đã xuất cảnh', ARRAY['departure_date'], NULL),
  
  -- Sau xuất cảnh (đang ở Nhật)
  ('terminated', 'post_departure', 'Phục hồi - Đang ở Nhật', ARRAY['departure_date', 'entry_date'], NULL);

-- Cập nhật stage 'terminated' thành không phải terminal nữa
UPDATE public.master_trainee_stages 
SET is_terminal = false 
WHERE stage_code = 'terminated';