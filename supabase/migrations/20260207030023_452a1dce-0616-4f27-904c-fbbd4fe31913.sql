-- Cập nhật view để không yêu cầu interview_pass_date
-- Logic đúng: Học viên ở giai đoạn "Đậu phỏng vấn" = cần làm hồ sơ

-- Drop và tạo lại legal_company_stats
DROP VIEW IF EXISTS legal_company_stats;
CREATE VIEW legal_company_stats AS
SELECT 
  t.receiving_company_id AS company_id,
  c.code,
  c.name,
  c.name_japanese,
  c.address,
  c.work_address,
  u.name AS union_name,
  jc.name AS job_category_name,
  t.interview_pass_date,
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') AS docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') AS docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') AS docs_completed,
  COUNT(*) AS total_passed
FROM trainees t
  JOIN companies c ON t.receiving_company_id = c.id
  LEFT JOIN unions u ON t.union_id = u.id
  LEFT JOIN job_categories jc ON t.job_category_id = jc.id
WHERE t.receiving_company_id IS NOT NULL 
  AND t.progression_stage = 'Đậu phỏng vấn'
GROUP BY t.receiving_company_id, c.code, c.name, c.name_japanese, c.address, c.work_address, u.name, jc.name, t.interview_pass_date;

-- Drop và tạo lại legal_summary_stats
DROP VIEW IF EXISTS legal_summary_stats;
CREATE VIEW legal_summary_stats AS
SELECT 
  COUNT(DISTINCT receiving_company_id) AS total_companies,
  COUNT(*) AS total_all,
  COUNT(*) FILTER (WHERE COALESCE(document_status, 'not_started') = 'not_started') AS docs_not_started,
  COUNT(*) FILTER (WHERE document_status = 'in_progress') AS docs_in_progress,
  COUNT(*) FILTER (WHERE document_status = 'completed') AS docs_completed,
  0::bigint AS total_paperwork,
  0::bigint AS total_departed
FROM trainees t
WHERE receiving_company_id IS NOT NULL 
  AND progression_stage = 'Đậu phỏng vấn';

-- Drop và tạo lại legal_trainee_type_stats
DROP VIEW IF EXISTS legal_trainee_type_stats;
CREATE VIEW legal_trainee_type_stats AS
SELECT 
  trainee_type,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE gender = 'Nam') AS male_count,
  COUNT(*) FILTER (WHERE gender = 'Nữ') AS female_count
FROM trainees t
WHERE receiving_company_id IS NOT NULL 
  AND progression_stage = 'Đậu phỏng vấn'
GROUP BY trainee_type;