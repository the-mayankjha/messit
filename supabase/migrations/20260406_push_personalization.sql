-- Add notification_mode to push_subscriptions
alter table public.push_subscriptions 
add column if not exists notification_mode text default 'stud';
