-- Phase 1: Thêm 3 database indexes cho bảng audit_logs
-- Mục đích: Tối ưu các query phổ biến (tìm theo thời gian, user, table_name)
-- Rủi ro: Rất thấp - chỉ tối ưu query, không thay đổi data

-- Index cho tìm kiếm/sắp xếp theo thời gian (query phổ biến nhất)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

-- Index cho filter theo user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id);

-- Index cho filter theo table_name
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name 
  ON audit_logs(table_name);