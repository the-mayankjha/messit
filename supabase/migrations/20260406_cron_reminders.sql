-- Enable the pg_cron extension if it's not already enabled
create extension if not exists pg_cron;

-- Create the cron job to run the meal reminders every minute.
-- The function itself handles the logic of checking if a meal is actually due.
-- Replace 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-meal-reminders' with your actual function URL
-- and 'YOUR_SERVICE_ROLE_KEY' with your service role key.
-- IMPORTANT: In Supabase, it is better to use the internal 'net' extension or similar if possible,
-- but for simplicity, we use curl via cron.

-- Note: In Supabase, you can also set these up via the UI under 'Project Settings' -> 'Database' -> 'Cron Jobs'.

select
  cron.schedule(
    'send-meal-reminders-job',
    '* * * * *', -- Every minute
    $$
    select
      net.http_post(
        url:='https://vlbmqpvmothkjbquyfzs.supabase.co/functions/v1/send-meal-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      );
    $$
  );

-- Documentation on how to verify:
-- select * from cron.job;
-- select * from cron.job_run_details order by start_time desc limit 10;
