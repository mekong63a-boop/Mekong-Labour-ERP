-- Update legal_company_stats view to only include trainees in document processing stages
-- (Passed interview but NOT yet departed or completed contract)
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
LEFT JOIN companies c ON t.receiving_company_id = c.id
LEFT JOIN unions u ON t.union_id = u.id
LEFT JOIN job_categories jc ON t.job_category_id = jc.id
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  -- Only include document processing stages: Đậu PV, Nộp hồ sơ, OTIT, Nyukan, COE
  -- Exclude: Chưa đậu, Xuất cảnh, Đang làm việc, Hoàn thành hợp đồng, Bỏ trốn, Về trước hạn
  AND t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')
GROUP BY 
  t.receiving_company_id, 
  c.code, c.name, c.name_japanese, c.address, c.work_address,
  u.name, jc.name,
  t.interview_pass_date;

-- Update legal_summary_stats view with same filtering
DROP VIEW IF EXISTS legal_summary_stats;
CREATE VIEW legal_summary_stats AS
SELECT 
  COUNT(DISTINCT t.receiving_company_id) AS total_companies,
  COUNT(*) AS total_all,
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') AS docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') AS docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') AS docs_completed,
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc')) AS total_departed,
  COUNT(*) FILTER (WHERE t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')) AS total_paperwork
FROM trainees t
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  AND t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn');

-- Update legal_trainee_type_stats view with same filtering
DROP VIEW IF EXISTS legal_trainee_type_stats;
CREATE VIEW legal_trainee_type_stats AS
SELECT 
  t.trainee_type,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE t.gender = 'Nam') AS male_count,
  COUNT(*) FILTER (WHERE t.gender = 'Nữ') AS female_count
FROM trainees t
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  AND t.progression_stage NOT IN ('Chưa đậu', 'Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn')
GROUP BY t.trainee_type;