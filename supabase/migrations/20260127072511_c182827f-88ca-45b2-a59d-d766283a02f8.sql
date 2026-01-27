-- Drop old view and create new one grouped by company + interview_pass_date
DROP VIEW IF EXISTS legal_company_stats;

-- New view: Each row = Company + Interview Pass Date (same day group)
CREATE VIEW legal_company_stats AS
SELECT
  c.id as company_id,
  c.code,
  c.name,
  c.name_japanese,
  c.address,
  c.work_address,
  t.interview_pass_date,
  -- Hồ sơ chưa làm: Chỉ đậu PV, chưa bắt đầu làm hồ sơ
  COUNT(*) FILTER (WHERE t.progression_stage = 'Đậu phỏng vấn')::int as docs_not_started,
  -- Hồ sơ đang làm: Nộp hồ sơ -> Visa
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa'))::int as docs_in_progress,
  -- Hồ sơ đã xong: Xuất cảnh trở đi
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::int as docs_completed,
  -- Tổng học viên đậu trong đợt này
  COUNT(*)::int as total_passed
FROM trainees t
JOIN companies c ON t.receiving_company_id = c.id
WHERE t.progression_stage IS NOT NULL
  AND t.progression_stage != 'Chưa đậu'
  AND t.interview_pass_date IS NOT NULL
GROUP BY c.id, c.code, c.name, c.name_japanese, c.address, c.work_address, t.interview_pass_date
ORDER BY t.interview_pass_date DESC, c.name;

COMMENT ON VIEW legal_company_stats IS 'SINGLE SOURCE OF TRUTH: Danh sách đợt tuyển (Công ty + Ngày đậu PV) và tình trạng hồ sơ';