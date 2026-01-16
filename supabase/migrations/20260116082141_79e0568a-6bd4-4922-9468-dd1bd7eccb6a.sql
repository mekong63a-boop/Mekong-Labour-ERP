-- Xóa tất cả dữ liệu liên quan đến học viên test
-- Thứ tự: các bảng con trước, bảng cha sau

-- 1. Xóa attendance
DELETE FROM attendance WHERE trainee_id IN (SELECT id FROM trainees);

-- 2. Xóa test_scores
DELETE FROM test_scores WHERE trainee_id IN (SELECT id FROM trainees);

-- 3. Xóa trainee_reviews
DELETE FROM trainee_reviews WHERE trainee_id IN (SELECT id FROM trainees);

-- 4. Xóa education_history
DELETE FROM education_history WHERE trainee_id IN (SELECT id FROM trainees);

-- 5. Xóa work_history
DELETE FROM work_history WHERE trainee_id IN (SELECT id FROM trainees);

-- 6. Xóa family_members
DELETE FROM family_members WHERE trainee_id IN (SELECT id FROM trainees);

-- 7. Xóa japan_relatives
DELETE FROM japan_relatives WHERE trainee_id IN (SELECT id FROM trainees);

-- 8. Xóa interview_history
DELETE FROM interview_history WHERE trainee_id IN (SELECT id FROM trainees);

-- 9. Xóa enrollment_history
DELETE FROM enrollment_history WHERE trainee_id IN (SELECT id FROM trainees);

-- 10. Cuối cùng xóa trainees
DELETE FROM trainees;