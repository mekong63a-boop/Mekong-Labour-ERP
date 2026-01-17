-- =====================================================
-- TỐI ƯU REALTIME: GIỮ LẠI CÁC BẢNG QUAN TRỌNG
-- =====================================================

-- Bước 1: Xóa các bảng KHÔNG CẦN THIẾT khỏi publication
ALTER PUBLICATION supabase_realtime DROP TABLE trainees;
ALTER PUBLICATION supabase_realtime DROP TABLE orders;
ALTER PUBLICATION supabase_realtime DROP TABLE companies;
ALTER PUBLICATION supabase_realtime DROP TABLE unions;
ALTER PUBLICATION supabase_realtime DROP TABLE job_categories;
ALTER PUBLICATION supabase_realtime DROP TABLE union_members;
ALTER PUBLICATION supabase_realtime DROP TABLE union_transactions;
ALTER PUBLICATION supabase_realtime DROP TABLE education_history;
ALTER PUBLICATION supabase_realtime DROP TABLE work_history;
ALTER PUBLICATION supabase_realtime DROP TABLE family_members;
ALTER PUBLICATION supabase_realtime DROP TABLE japan_relatives;
ALTER PUBLICATION supabase_realtime DROP TABLE interview_history;
ALTER PUBLICATION supabase_realtime DROP TABLE trainee_reviews;
ALTER PUBLICATION supabase_realtime DROP TABLE enrollment_history;
ALTER PUBLICATION supabase_realtime DROP TABLE classes;
ALTER PUBLICATION supabase_realtime DROP TABLE teachers;
ALTER PUBLICATION supabase_realtime DROP TABLE class_teachers;
ALTER PUBLICATION supabase_realtime DROP TABLE test_scores;
ALTER PUBLICATION supabase_realtime DROP TABLE vocabulary;
ALTER PUBLICATION supabase_realtime DROP TABLE katakana_names;
ALTER PUBLICATION supabase_realtime DROP TABLE religions;
ALTER PUBLICATION supabase_realtime DROP TABLE referral_sources;
ALTER PUBLICATION supabase_realtime DROP TABLE policy_categories;
ALTER PUBLICATION supabase_realtime DROP TABLE profiles;

-- Bước 2: THÊM các bảng permissions quan trọng
-- GIỮ LẠI: attendance, menus, user_roles (đã có sẵn)
ALTER PUBLICATION supabase_realtime ADD TABLE user_menu_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE department_menu_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE department_members;