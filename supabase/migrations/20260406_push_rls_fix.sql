-- 1. Remove old restrictive policies
drop policy if exists "Users can manage their own push subscriptions" on public.push_subscriptions;
drop policy if exists "Anonymous subscriptions allowed" on public.push_subscriptions;
drop policy if exists "Anonymous can refresh anonymous subscriptions" on public.push_subscriptions;

-- 2. Allow Authenticated users to claim their previous guest subscriptions
create policy "Authenticated users can manage their own subscriptions"
on public.push_subscriptions
for all
to authenticated
using (email = (auth.jwt() ->> 'email')::text or email is null)
with check (email = (auth.jwt() ->> 'email')::text);

-- 3. Keep Anonymous users focused on guest records only
create policy "Anonymous users manage guest subscriptions"
on public.push_subscriptions
for all
to anon
using (email is null)
with check (email is null);

-- 4. Enable public visibility for debugging tools (optional but helpful)
create policy "Public visibility for sync status"
on public.push_subscriptions
for select
to authenticated, anon
using (true);
