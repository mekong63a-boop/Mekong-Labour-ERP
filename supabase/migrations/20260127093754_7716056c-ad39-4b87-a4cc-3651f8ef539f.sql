-- Update legal views to only include trainees with progression_stage = 'Đậu phỏng vấn'
DROP VIEW IF EXISTS legal_company_stats;
CREATE VIEW legal_company_stats WITH (security_invoker=on) AS
SELECT 
  t.receiving_company_id as company_id,
  c.code,
  c.name,
  c.name_japanese,
  c.address,
  c.work_address,
  u.name as union_name,
  jc.name as job_category_name,
  t.interview_pass_date,
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') as docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') as docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') as docs_completed,
  COUNT(*) as total_passed
FROM trainees t
JOIN companies c ON t.receiving_company_id = c.id
LEFT JOIN unions u ON t.union_id = u.id
LEFT JOIN job_categories jc ON t.job_category_id = jc.id
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  AND t.progression_stage = 'Đậu phỏng vấn'
GROUP BY 
  t.receiving_company_id, 
  c.code, c.name, c.name_japanese, c.address, c.work_address,
  u.name, jc.name, t.interview_pass_date;

DROP VIEW IF EXISTS legal_summary_stats;
CREATE VIEW legal_summary_stats WITH (security_invoker=on) AS
SELECT 
  COUNT(DISTINCT t.receiving_company_id) as total_companies,
  COUNT(*) as total_all,
  COUNT(*) FILTER (WHERE COALESCE(t.document_status, 'not_started') = 'not_started') as docs_not_started,
  COUNT(*) FILTER (WHERE t.document_status = 'in_progress') as docs_in_progress,
  COUNT(*) FILTER (WHERE t.document_status = 'completed') as docs_completed,
  0::bigint as total_paperwork,
  0::bigint as total_departed
FROM trainees t
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  AND t.progression_stage = 'Đậu phỏng vấn';

DROP VIEW IF EXISTS legal_trainee_type_stats;
CREATE VIEW legal_trainee_type_stats WITH (security_invoker=on) AS
SELECT 
  t.trainee_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE t.gender = 'Nam') as male_count,
  COUNT(*) FILTER (WHERE t.gender = 'Nữ') as female_count
FROM trainees t
WHERE t.interview_pass_date IS NOT NULL
  AND t.receiving_company_id IS NOT NULL
  AND t.progression_stage = 'Đậu phỏng vấn'
GROUP BY t.trainee_type;