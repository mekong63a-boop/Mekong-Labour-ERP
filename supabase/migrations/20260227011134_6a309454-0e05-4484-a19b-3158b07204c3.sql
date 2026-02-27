
-- Index cho audit_logs.record_id (bảng lớn nhất)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- GIN trigram indexes cho search ilike
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_trainees_trainee_code_trgm ON trainees USING gin (trainee_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trainees_birthplace_trgm ON trainees USING gin (birthplace gin_trgm_ops);
