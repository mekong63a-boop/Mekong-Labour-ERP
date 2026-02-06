-- Thêm 2 cột mới cho chứng chỉ tiếng Nhật và chứng chỉ đặc định
ALTER TABLE trainees 
  ADD COLUMN IF NOT EXISTS japanese_certificate text,
  ADD COLUMN IF NOT EXISTS ssw_certificate text;

COMMENT ON COLUMN trainees.japanese_certificate IS 'Chứng chỉ tiếng Nhật (JLPT, NAT-Test, JFT)';
COMMENT ON COLUMN trainees.ssw_certificate IS 'Chứng chỉ đặc định (Specified Skilled Worker certificates)';