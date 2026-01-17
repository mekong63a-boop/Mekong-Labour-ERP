-- Enable realtime for classes table
ALTER PUBLICATION supabase_realtime ADD TABLE classes;

-- Enable realtime for class_teachers table
ALTER PUBLICATION supabase_realtime ADD TABLE class_teachers;

-- Enable realtime for attendance table
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- Enable realtime for test_scores table
ALTER PUBLICATION supabase_realtime ADD TABLE test_scores;