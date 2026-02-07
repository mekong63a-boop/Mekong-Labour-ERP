-- Thêm các cột pháp lý mới vào bảng trainees cho menu Tình trạng hồ sơ
-- Các cột từ hình ảnh: Ngày trình ĐKHĐ, Số ĐKHĐ, Ngày gửi xin TPC, Số CV xin TPC, Số PTL, Ngày cấp TPC, Hiện trạng

ALTER TABLE public.trainees
ADD COLUMN IF NOT EXISTS dkhd_date date,
ADD COLUMN IF NOT EXISTS dkhd_number text,
ADD COLUMN IF NOT EXISTS tpc_request_date date,
ADD COLUMN IF NOT EXISTS tpc_cv_number text,
ADD COLUMN IF NOT EXISTS ptl_number text,
ADD COLUMN IF NOT EXISTS tpc_issue_date date,
ADD COLUMN IF NOT EXISTS current_situation text;

COMMENT ON COLUMN public.trainees.dkhd_date IS 'Ngày trình ĐKHĐ';
COMMENT ON COLUMN public.trainees.dkhd_number IS 'Số ĐKHĐ';
COMMENT ON COLUMN public.trainees.tpc_request_date IS 'Ngày gửi xin TPC';
COMMENT ON COLUMN public.trainees.tpc_cv_number IS 'Số CV xin TPC';
COMMENT ON COLUMN public.trainees.ptl_number IS 'Số PTL';
COMMENT ON COLUMN public.trainees.tpc_issue_date IS 'Ngày cấp TPC';
COMMENT ON COLUMN public.trainees.current_situation IS 'Hiện trạng hồ sơ';