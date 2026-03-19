-- Drop dependent view first, then recreate both
DROP VIEW IF EXISTS public.dashboard_education_total;
DROP VIEW IF EXISTS public.class_student_counts;

CREATE VIEW public.class_student_counts WITH (security_invoker=on) AS
SELECT c.id AS class_id,
    (COALESCE(count(t.id), 0::bigint))::integer AS current_students
FROM classes c
LEFT JOIN trainees t ON t.class_id = c.id AND t.simple_status = 'DangHoc'::simple_status AND t.deleted_at IS NULL
GROUP BY c.id;

CREATE VIEW public.dashboard_education_total WITH (security_invoker=on) AS
SELECT (COALESCE(sum(current_students), 0::bigint))::integer AS total_studying
FROM class_student_counts;