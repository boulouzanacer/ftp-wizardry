-- Remove the existing cron job
SELECT cron.unschedule('sync-ftp-files-every-5-minutes');

-- Create a new cron job that uses GET method (which your function expects for sync)
SELECT cron.schedule(
  'sync-ftp-files-every-5-minutes',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_get(
        url:='https://gasbrtqkyjxhoycimhgs.supabase.co/functions/v1/sync-ftp-files',
        headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhc2JydHFreWp4aG95Y2ltaGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQyMzgsImV4cCI6MjA2ODYwMDIzOH0.M18tBVxAOODe0zzx_iEsPcel96JaOriDNf8R_cICoIY"}'::jsonb
    ) as request_id;
  $$
);