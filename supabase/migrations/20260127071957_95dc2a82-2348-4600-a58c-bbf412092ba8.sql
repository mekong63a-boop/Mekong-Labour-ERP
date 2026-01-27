-- Drop and recreate legal_summary_stats with additional document status columns
DROP VIEW IF EXISTS legal_summary_stats;

CREATE VIEW legal_summary_stats AS
SELECT
  COUNT(DISTINCT t.receiving_company_id)::int as total_companies,
  COUNT(*)::int as total_all,
  -- Hồ sơ chưa làm: Đậu PV nhưng chưa nộp OTIT
  COUNT(*) FILTER (WHERE t.progression_stage = 'Đậu phỏng vấn')::int as docs_not_started,
  -- Hồ sơ đang làm: Đang trong quy trình OTIT -> Visa
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa'))::int as docs_in_progress,
  -- Hồ sơ đã làm xong: Đã xuất cảnh hoặc các giai đoạn sau
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::int as docs_completed,
  -- Keep legacy columns for backward compatibility
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE', 'Visa'))::int as total_paperwork,
  COUNT(*) FILTER (WHERE t.progression_stage IN ('Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::int as total_departed
FROM trainees t
WHERE t.progression_stage IS NOT NULL
  AND t.progression_stage != 'Chưa đậu'
  AND t.receiving_company_id IS NOT NULL;

-- Create view for trainee type stats (for the tabs)
CREATE OR REPLACE VIEW legal_trainee_type_stats AS
SELECT
  trainee_type,
  COUNT(*)::int as count
FROM trainees
WHERE progression_stage IS NOT NULL
  AND progression_stage != 'Chưa đậu'
  AND receiving_company_id IS NOT NULL
GROUP BY trainee_type;

COMMENT ON VIEW legal_summary_stats IS 'SINGLE SOURCE OF TRUTH: Thống kê tổng hợp tình trạng hồ sơ pháp lý';
COMMENT ON VIEW legal_trainee_type_stats IS 'SINGLE SOURCE OF TRUTH: Thống kê học viên đậu theo loại hình';