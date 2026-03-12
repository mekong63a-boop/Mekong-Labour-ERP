
-- Remove old cron job
SELECT cron.unschedule('weekly-full-backup');
