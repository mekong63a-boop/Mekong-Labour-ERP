-- Enable realtime for all remaining tables in the system

-- Orders module
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Partners module
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE unions;
ALTER PUBLICATION supabase_realtime ADD TABLE job_categories;

-- Internal Union module  
ALTER PUBLICATION supabase_realtime ADD TABLE union_members;
ALTER PUBLICATION supabase_realtime ADD TABLE union_transactions;

-- User permissions and roles (already added but ensure they're there)
-- These are critical for real-time permission updates
-- user_roles, user_menu_permissions, department_members, department_menu_permissions were already added

-- Education related tables (family, work history, etc)
ALTER PUBLICATION supabase_realtime ADD TABLE education_history;
ALTER PUBLICATION supabase_realtime ADD TABLE work_history;
ALTER PUBLICATION supabase_realtime ADD TABLE family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE japan_relatives;
ALTER PUBLICATION supabase_realtime ADD TABLE interview_history;

-- Trainee reviews and enrollments
ALTER PUBLICATION supabase_realtime ADD TABLE trainee_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE enrollment_history;

-- Glossary tables
ALTER PUBLICATION supabase_realtime ADD TABLE vocabulary;
ALTER PUBLICATION supabase_realtime ADD TABLE katakana_names;
ALTER PUBLICATION supabase_realtime ADD TABLE religions;
ALTER PUBLICATION supabase_realtime ADD TABLE referral_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE policy_categories;

-- Menus table for permission sync
ALTER PUBLICATION supabase_realtime ADD TABLE menus;

-- Profiles for user info sync
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;