# Supabase Push Notifications Setup Guide

To enable push notifications (Meal Reminders, Broadcasts, Build Updates), you must configure your VAPID secrets in Supabase.

## 1. Secrets Configuration

Run these commands using the Supabase CLI or set them in the **Settings > API > Edge Function Secrets** section of your Supabase Dashboard:

```bash
# Your email or website URL (required by push services)
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"

# The Public Key from your .env (VITE_VAPID_PUBLIC_KEY)
supabase secrets set VAPID_PUBLIC_KEY="BO8x..."

# The Private Key corresponding to your Public Key
supabase secrets set VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

## 2. Deploy Functions

Deploy the functions to your Supabase project:

```bash
supabase functions deploy _shared
supabase functions deploy send-meal-reminders
supabase functions deploy send-broadcast-push
supabase functions deploy send-build-update-push
```

## 3. Enable Automation (Meal Reminders)

1. Go to **Database > Extensions** in the Supabase Dashboard.
2. Enable `pg_cron` and `pg_net`.
3. Run the SQL in `supabase/migrations/20260406_cron_reminders.sql` in the **SQL Editor**.
   - **Note**: Replace `YOUR_SERVICE_ROLE_KEY` with the key found in **Settings > API**.

## 4. Troubleshooting

- **Internal Server Error**: Check if all 3 VAPID secrets are set.
- **403 Forbidden**: Ensure the `Authorization: Bearer` header uses the `service_role` key in the cron job.
- **No notifications**: Check the `notification_dispatch_log` table to see if the server attempted to send them.
