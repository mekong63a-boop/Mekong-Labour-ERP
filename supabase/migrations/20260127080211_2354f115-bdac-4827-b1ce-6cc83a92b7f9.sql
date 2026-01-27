
-- Add document_status field to trainees table
-- Values: 'not_started' (Chưa làm), 'in_progress' (Đang làm), 'completed' (Đã xong)
ALTER TABLE public.trainees 
ADD COLUMN IF NOT EXISTS document_status TEXT DEFAULT 'not_started';

-- Update legal_company_stats view to:
-- 1. Only include trainees who passed interview but NOT yet departed
-- 2. Use document_status field instead of progression_stage
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
  -- Use document_status field
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') AS docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') AS docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') AS docs_completed,
  -- Total passed (not departed)
  COUNT(*) AS total_passed
FROM trainees t
JOIN companies c ON c.id = t.receiving_company_id
LEFT JOIN unions u ON u.id = t.union_id
LEFT JOIN job_categories jc ON jc.id = t.job_category_id
WHERE t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND t.progression_stage IS NOT NULL
  AND t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh')  -- Exclude not-passed and departed
GROUP BY 
  t.receiving_company_id, 
  c.code, 
  c.name, 
  c.name_japanese, 
  c.address, 
  c.work_address,
  u.name,
  jc.name,
  t.interview_pass_date;

-- Update legal_summary_stats view
DROP VIEW IF EXISTS legal_summary_stats;

CREATE VIEW legal_summary_stats AS
SELECT
  COUNT(DISTINCT t.receiving_company_id) AS total_companies,
  COUNT(*) AS total_all,
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') AS docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') AS docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') AS docs_completed,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') AS total_paperwork,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') AS total_departed
FROM trainees t
WHERE t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND t.progression_stage IS NOT NULL
  AND t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh');

-- Update legal_trainee_type_stats view (only passed, not departed)
DROP VIEW IF EXISTS legal_trainee_type_stats;

CREATE VIEW legal_trainee_type_stats AS
SELECT 
  trainee_type,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE gender = 'Nam') AS male_count,
  COUNT(*) FILTER (WHERE gender = 'Nữ') AS female_count
FROM trainees
WHERE receiving_company_id IS NOT NULL
  AND interview_pass_date IS NOT NULL
  AND progression_stage IS NOT NULL
  AND progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh')
GROUP BY trainee_type;
