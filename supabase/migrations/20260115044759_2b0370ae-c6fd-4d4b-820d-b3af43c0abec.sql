-- Enable pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search index cho tên học viên
CREATE INDEX IF NOT EXISTS idx_trainees_full_name_trgm 
ON trainees USING gin (full_name gin_trgm_ops);

-- B-tree indexes cho các cột filter phổ biến
CREATE INDEX IF NOT EXISTS idx_trainees_progression_stage ON trainees(progression_stage);
CREATE INDEX IF NOT EXISTS idx_trainees_simple_status ON trainees(simple_status);
CREATE INDEX IF NOT EXISTS idx_trainees_birthplace ON trainees(birthplace);
CREATE INDEX IF NOT EXISTS idx_trainees_trainee_code ON trainees(trainee_code);
CREATE INDEX IF NOT EXISTS idx_trainees_trainee_type ON trainees(trainee_type);
CREATE INDEX IF NOT EXISTS idx_trainees_enrollment_status ON trainees(enrollment_status);

-- Composite indexes cho filter + sort (quan trọng nhất cho pagination)
CREATE INDEX IF NOT EXISTS idx_trainees_status_updated 
ON trainees(simple_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_trainees_stage_updated 
ON trainees(progression_stage, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_trainees_type_updated
ON trainees(trainee_type, updated_at DESC);

-- Foreign key indexes cho các bảng liên kết
CREATE INDEX IF NOT EXISTS idx_family_members_trainee_id ON family_members(trainee_id);
CREATE INDEX IF NOT EXISTS idx_education_history_trainee_id ON education_history(trainee_id);
CREATE INDEX IF NOT EXISTS idx_work_history_trainee_id ON work_history(trainee_id);
CREATE INDEX IF NOT EXISTS idx_interview_history_trainee_id ON interview_history(trainee_id);
CREATE INDEX IF NOT EXISTS idx_japan_relatives_trainee_id ON japan_relatives(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee_id ON attendance(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);

-- Index cho orders
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_union_id ON orders(union_id);
CREATE INDEX IF NOT EXISTS idx_orders_job_category_id ON orders(job_category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Chạy ANALYZE để cập nhật statistics
ANALYZE trainees;
ANALYZE family_members;
ANALYZE education_history;
ANALYZE work_history;
ANALYZE interview_history;
ANALYZE japan_relatives;
ANALYZE attendance;
ANALYZE orders;