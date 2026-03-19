CREATE OR REPLACE VIEW public.education_interview_stats AS
SELECT 
    count(*) FILTER (WHERE simple_status = 'DaDau' AND gender = 'Nam') AS passed_male,
    count(*) FILTER (WHERE simple_status = 'DaDau' AND gender = 'Nữ') AS passed_female,
    count(*) FILTER (WHERE simple_status = 'DaDau') AS passed_total,
    count(*) FILTER (WHERE (simple_status IS NULL OR simple_status <> 'DaDau') AND gender = 'Nam') AS not_passed_male,
    count(*) FILTER (WHERE (simple_status IS NULL OR simple_status <> 'DaDau') AND gender = 'Nữ') AS not_passed_female,
    count(*) FILTER (WHERE simple_status IS NULL OR simple_status <> 'DaDau') AS not_passed_total
FROM trainees t
WHERE simple_status = 'DangHoc' AND deleted_at IS NULL;