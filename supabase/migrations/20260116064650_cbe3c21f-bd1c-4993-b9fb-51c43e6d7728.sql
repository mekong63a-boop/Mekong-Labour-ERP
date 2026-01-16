-- Drop existing triggers if they exist, then create new ones

-- 1. Trainees table
DROP TRIGGER IF EXISTS audit_trainees_changes ON public.trainees;
CREATE TRIGGER audit_trainees_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.trainees
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 2. Orders table
DROP TRIGGER IF EXISTS audit_orders_changes ON public.orders;
CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 3. Companies table
DROP TRIGGER IF EXISTS audit_companies_changes ON public.companies;
CREATE TRIGGER audit_companies_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 4. Unions table
DROP TRIGGER IF EXISTS audit_unions_changes ON public.unions;
CREATE TRIGGER audit_unions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.unions
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 5. Job categories table
DROP TRIGGER IF EXISTS audit_job_categories_changes ON public.job_categories;
CREATE TRIGGER audit_job_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.job_categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 6. Classes table
DROP TRIGGER IF EXISTS audit_classes_changes ON public.classes;
CREATE TRIGGER audit_classes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 7. Teachers table
DROP TRIGGER IF EXISTS audit_teachers_changes ON public.teachers;
CREATE TRIGGER audit_teachers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 8. User roles table
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 9. Profiles table
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 10. Family members table
DROP TRIGGER IF EXISTS audit_family_members_changes ON public.family_members;
CREATE TRIGGER audit_family_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 11. Education history table
DROP TRIGGER IF EXISTS audit_education_history_changes ON public.education_history;
CREATE TRIGGER audit_education_history_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.education_history
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 12. Work history table
DROP TRIGGER IF EXISTS audit_work_history_changes ON public.work_history;
CREATE TRIGGER audit_work_history_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.work_history
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 13. Japan relatives table
DROP TRIGGER IF EXISTS audit_japan_relatives_changes ON public.japan_relatives;
CREATE TRIGGER audit_japan_relatives_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.japan_relatives
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 14. Attendance table
DROP TRIGGER IF EXISTS audit_attendance_changes ON public.attendance;
CREATE TRIGGER audit_attendance_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 15. Test scores table
DROP TRIGGER IF EXISTS audit_test_scores_changes ON public.test_scores;
CREATE TRIGGER audit_test_scores_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.test_scores
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 16. Trainee reviews table
DROP TRIGGER IF EXISTS audit_trainee_reviews_changes ON public.trainee_reviews;
CREATE TRIGGER audit_trainee_reviews_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.trainee_reviews
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 17. Interview history table
DROP TRIGGER IF EXISTS audit_interview_history_changes ON public.interview_history;
CREATE TRIGGER audit_interview_history_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.interview_history
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();