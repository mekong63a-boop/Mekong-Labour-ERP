
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule weekly backup at 2:00 AM every Monday (Vietnam time UTC+7 = 19:00 UTC Sunday)
SELECT cron.schedule(
  'weekly-full-backup',
  '0 19 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://bcltzwpnhfpbfiuhfkxi.supabase.co/functions/v1/weekly-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHR6d3BuaGZwYmZpdWhma3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTU0NDQsImV4cCI6MjA4Mzg3MTQ0NH0.ktTKQxMCXGhXaaa5OkfDrx9I0-YPESh8Z4kHNBQkCJ4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);
