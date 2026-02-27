
-- View đếm sĩ số lớp học: chỉ đếm học viên có simple_status = 'Đang học'
CREATE OR REPLACE VIEW public.class_student_counts AS
SELECT 
  c.id AS class_id,
  COALESCE(COUNT(t.id), 0)::integer AS current_students
FROM classes c
LEFT JOIN trainees t ON t.class_id = c.id AND t.simple_status = 'Đang học'
GROUP BY c.id;

-- Grant access
GRANT SELECT ON public.class_student_counts TO authenticated, anon;
