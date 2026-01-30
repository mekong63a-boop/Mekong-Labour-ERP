
-- SYSTEM FIX: Xóa departure_date cho các học viên đã được đổi về stage trước xuất cảnh
-- Điều này đảm bảo họ có thể được gán lớp/KTX lại

UPDATE trainees 
SET 
  departure_date = NULL,
  absconded_date = NULL,
  early_return_date = NULL,
  early_return_reason = NULL,
  return_date = NULL
WHERE departure_date IS NOT NULL
  AND progression_stage IN ('Chưa đậu', 'Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE');

-- Comment để ghi nhớ quy tắc
COMMENT ON COLUMN trainees.departure_date IS 'Ngày xuất cảnh - tự động xóa khi đổi về stage trước xuất cảnh. Logic: Học viên có departure_date sẽ bị loại khỏi danh sách gán lớp/KTX.';
