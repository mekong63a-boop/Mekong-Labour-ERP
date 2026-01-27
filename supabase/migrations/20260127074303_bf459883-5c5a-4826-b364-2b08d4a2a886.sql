-- Drop and recreate legal_company_stats with new columns
DROP VIEW IF EXISTS legal_company_stats;

CREATE VIEW legal_company_stats AS
SELECT 
  c.id AS company_id,
  c.code,
  c.name,
  c.name_japanese,
  c.address,
  c.work_address,
  u.name AS union_name,
  jc.name AS job_category_name,
  t.interview_pass_date,
  COUNT(*) AS total_passed,
  -- docs_not_started: trained stage = đậu phỏng vấn, đang học
  COUNT(*) FILTER (
    WHERE tw.current_stage = 'trained'
  ) AS docs_not_started,
  -- docs_in_progress: visa_processing, ready_to_depart = đang làm hồ sơ
  COUNT(*) FILTER (
    WHERE tw.current_stage IN ('visa_processing', 'ready_to_depart')
  ) AS docs_in_progress,
  -- docs_completed: departed, post_departure = đã hoàn thành hồ sơ
  COUNT(*) FILTER (
    WHERE tw.current_stage IN ('departed', 'post_departure')
  ) AS docs_completed
FROM trainees t
JOIN companies c ON t.receiving_company_id = c.id
LEFT JOIN unions u ON t.union_id = u.id
LEFT JOIN job_categories jc ON t.job_category_id = jc.id
LEFT JOIN trainee_workflow tw ON t.id = tw.trainee_id
WHERE 
  t.receiving_company_id IS NOT NULL
  AND t.interview_pass_date IS NOT NULL
  AND tw.current_stage IS NOT NULL
  AND tw.current_stage NOT IN ('recruited', 'archived')
GROUP BY 
  c.id, c.code, c.name, c.name_japanese, c.address, c.work_address,
  u.name, jc.name, t.interview_pass_date
ORDER BY t.interview_pass_date DESC;