-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job that runs every 5 minutes to sync FTP files
SELECT cron.schedule(
  'sync-ftp-files-every-5-minutes',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://gasbrtqkyjxhoycimhgs.supabase.co/functions/v1/sync-ftp-files',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhc2JydHFreWp4aG95Y2ltaGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQyMzgsImV4cCI6MjA2ODYwMDIzOH0.M18tBVxAOODe0zzx_iEsPcel96JaOriDNf8R_cICoIY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);