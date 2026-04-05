# Push Notifications Setup

This project now includes web push support for:

- app update availability
- broadcast messages
- meal reminders

## Required env vars

Client `.env`:

- `VITE_VAPID_PUBLIC_KEY=...`

Supabase Edge Functions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_SUBJECT=mailto:you@example.com`
- `VAPID_PUBLIC_KEY=...`
- `VAPID_PRIVATE_KEY=...`

## Database

Run the migration in:

- `supabase/migrations/20260405_push_notifications.sql`

## Deploy functions

Deploy:

- `send-build-update-push`
- `send-broadcast-push`
- `send-meal-reminders`

## Scheduling

Set `send-meal-reminders` on a cron schedule every minute or every 5 minutes.

## Triggering pushes

- Call `send-build-update-push` after a new production build is deployed.
- Call `send-broadcast-push` after an announcement is created.
