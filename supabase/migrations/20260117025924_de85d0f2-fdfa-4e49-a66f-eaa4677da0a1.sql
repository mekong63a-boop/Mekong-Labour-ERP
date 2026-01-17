-- Enable Realtime for user_roles table so role changes sync across browsers
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- Enable Realtime for trainees table so data changes sync across browsers  
ALTER PUBLICATION supabase_realtime ADD TABLE trainees;