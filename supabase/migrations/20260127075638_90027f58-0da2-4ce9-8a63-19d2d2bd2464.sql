
-- Fix legal_company_stats view with correct progression_stage values
-- and include all companies with passed trainees

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
  -- Đậu phỏng vấn = not started
  COUNT(*) FILTER (WHERE t.progression_stage = 'Đậu phỏng vấn') AS docs_not_started,
  -- Nộp hồ sơ, Hoàn thành hợ đồng, COE = in progress
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'Hoàn thành hợp đồng', 'COE')) AS docs_in_progress,
  -- Xuất cảnh = completed
  COUNT(*) FILTER (WHERE t.progression_stage = 'Xuất cảnh') AS docs_completed,
  -- Total passed
  COUNT(*) AS total_passed
FROM trainees t
JOIN companies c ON c.id = t.receiving_company_id
LEFT JOIN unions u ON u.id = t.union_id
LEFT JOIN job_categories jc ON jc.id = t.job_category_id
WHERE t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND t.progression_stage IS NOT NULL
  AND t.progression_stage != 'Chưa đậu'
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

-- Fix legal_summary_stats view  
DROP VIEW IF EXISTS legal_summary_stats;

CREATE VIEW legal_summary_stats AS
SELECT
  COUNT(DISTINCT t.receiving_company_id) AS total_companies,
  COUNT(*) AS total_all,
  COUNT(*) FILTER (WHERE t.progression_stage = 'Đậu phỏng vấn') AS docs_not_started,
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'Hoàn thành hợp đồng', 'COE')) AS docs_in_progress,
  COUNT(*) FILTER (WHERE t.progression_stage = 'Xuất cảnh') AS docs_completed,
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'Hoàn thành hợp đồng', 'COE')) AS total_paperwork,
  COUNT(*) FILTER (WHERE t.progression_stage = 'Xuất cảnh') AS total_departed
FROM trainees t
WHERE t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND t.progression_stage IS NOT NULL
  AND t.progression_stage != 'Chưa đậu';

-- Fix legal_trainee_type_stats view with gender breakdown
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
  AND progression_stage != 'Chưa đậu'
GROUP BY trainee_type;
