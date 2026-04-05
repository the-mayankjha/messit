create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text null,
  endpoint text not null unique,
  p256dh text null,
  auth text null,
  hostel text null,
  mess_type text null,
  role text default 'None',
  build_version text null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_email_idx
  on public.push_subscriptions (email);

create index if not exists push_subscriptions_hostel_mess_idx
  on public.push_subscriptions (hostel, mess_type);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (email = auth.jwt() ->> 'email')
with check (email = auth.jwt() ->> 'email');

create policy "Anonymous subscriptions allowed"
on public.push_subscriptions
for insert
to anon
with check (email is null);

create policy "Anonymous can refresh anonymous subscriptions"
on public.push_subscriptions
for update
to anon
using (email is null)
with check (email is null);

create table if not exists public.notification_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  dispatch_type text not null,
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notification_dispatch_log enable row level security;

create policy "Only service role manages dispatch log"
on public.notification_dispatch_log
for all
to authenticated
using (false)
with check (false);
