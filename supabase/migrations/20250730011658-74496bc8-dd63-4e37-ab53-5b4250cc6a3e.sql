-- Disable the cron job that creates test files every 5 minutes
SELECT cron.unschedule('sync-ftp-files-every-5-minutes');