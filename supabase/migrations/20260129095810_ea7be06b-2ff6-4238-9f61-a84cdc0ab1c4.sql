-- Update dashboard_trainee_kpis view to exclude departed trainees from studying count
-- SYSTEM RULE: Học viên đã xuất cảnh (có departure_date hoặc progression_stage trong nhóm DEPARTED_STAGES) 
-- không được tính vào số liệu "đang đào tạo"

CREATE OR REPLACE VIEW dashboard_trainee_kpis AS
WITH valid_classes AS (
    SELECT id FROM classes WHERE status = 'Đang hoạt động'
),
-- Định nghĩa các stage đã xuất cảnh
departed_stages AS (
    SELECT unnest(ARRAY['Xuất cảnh', 'Đang làm việc', 'Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng']::progression_stage[]) AS stage
)
SELECT 
    COUNT(*)::integer AS total_trainees,
    COUNT(*) FILTER (WHERE gender = 'Nam')::integer AS total_male,
    COUNT(*) FILTER (WHERE gender = 'Nữ')::integer AS total_female,
    
    -- CRITICAL FIX: Học viên đang đào tạo = có class_id trong lớp active VÀ CHƯA xuất cảnh
    COUNT(*) FILTER (
        WHERE class_id IS NOT NULL 
        AND class_id IN (SELECT id FROM valid_classes)
        AND departure_date IS NULL
        AND (progression_stage IS NULL OR progression_stage NOT IN (SELECT stage FROM departed_stages))
    )::integer AS status_studying,
    
    COUNT(*) FILTER (
        WHERE class_id IS NOT NULL 
        AND class_id IN (SELECT id FROM valid_classes)
        AND departure_date IS NULL
        AND (progression_stage IS NULL OR progression_stage NOT IN (SELECT stage FROM departed_stages))
        AND gender = 'Nam'
    )::integer AS studying_male,
    
    COUNT(*) FILTER (
        WHERE class_id IS NOT NULL 
        AND class_id IN (SELECT id FROM valid_classes)
        AND departure_date IS NULL
        AND (progression_stage IS NULL OR progression_stage NOT IN (SELECT stage FROM departed_stages))
        AND gender = 'Nữ'
    )::integer AS studying_female,
    
    -- Xuất cảnh năm nay
    COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS departed_this_year,
    COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE) AND gender = 'Nam')::integer AS departed_male,
    COUNT(*) FILTER (WHERE DATE_TRUNC('year', departure_date) = DATE_TRUNC('year', CURRENT_DATE) AND gender = 'Nữ')::integer AS departed_female,
    
    -- Các stage
    COUNT(*) FILTER (WHERE progression_stage IS NULL OR progression_stage = 'Chưa đậu')::integer AS stage_recruited,
    COUNT(*) FILTER (WHERE progression_stage IN ('Đậu phỏng vấn', 'Nộp hồ sơ', 'OTIT', 'Nyukan', 'COE'))::integer AS stage_visa_processing,
    COUNT(*) FILTER (WHERE progression_stage = 'Visa')::integer AS stage_ready_to_depart,
    COUNT(*) FILTER (WHERE progression_stage = 'Xuất cảnh')::integer AS stage_departed,
    COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_in_japan,
    COUNT(*) FILTER (WHERE progression_stage IN ('Bỏ trốn', 'Về trước hạn', 'Hoàn thành hợp đồng'))::integer AS stage_archived,
    COUNT(*) FILTER (WHERE progression_stage = 'Đang làm việc')::integer AS stage_post_departure,
    
    -- Loại hình (sử dụng đúng giá trị enum)
    COUNT(*) FILTER (WHERE trainee_type = 'Thực tập sinh')::integer AS type_tts,
    COUNT(*) FILTER (WHERE trainee_type = 'Kỹ năng đặc định')::integer AS type_knd,
    COUNT(*) FILTER (WHERE trainee_type = 'Kỹ sư')::integer AS type_engineer,
    COUNT(*) FILTER (WHERE trainee_type = 'Du học sinh')::integer AS type_student,
    COUNT(*) FILTER (WHERE trainee_type = 'Thực tập sinh số 3')::integer AS type_tts3,
    
    -- Đăng ký
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', registration_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS registered_this_month,
    COUNT(*) FILTER (WHERE DATE_TRUNC('year', registration_date) = DATE_TRUNC('year', CURRENT_DATE))::integer AS registered_this_year,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', departure_date) = DATE_TRUNC('month', CURRENT_DATE))::integer AS departed_this_month,
    
    -- Đơn tuyển đang hoạt động
    (SELECT COUNT(*)::integer FROM orders WHERE status = 'Đang tuyển') AS active_orders
FROM trainees;