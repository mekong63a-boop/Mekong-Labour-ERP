
-- Create helper function to set up the cron job using the secret from vault
-- This reads the secret at SCHEDULE TIME, not at definition time
CREATE OR REPLACE FUNCTION public.setup_backup_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  -- Schedule: 2:00 AM Monday Vietnam time (UTC+7) = 19:00 Sunday UTC
  PERFORM cron.schedule(
    'weekly-full-backup',
    '0 19 * * 0',
    $$
    SELECT net.http_post(
      url := 'https://bcltzwpnhfpbfiuhfkxi.supabase.co/functions/v1/weekly-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.backup_cron_secret', true)
      ),
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
    $$
  );
END;
$fn$;
