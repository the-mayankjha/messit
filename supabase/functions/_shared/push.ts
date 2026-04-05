import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

export function createAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function configureWebPush() {
  const subject = Deno.env.get('VAPID_SUBJECT')!;
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export async function sendPushToSubscriptions(subscriptions: any[], payload: Record<string, unknown>) {
  const supabase = createAdminClient();
  const webPushClient = configureWebPush();

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webPushClient.sendNotification(pushSubscription, JSON.stringify(payload));
        return { endpoint: subscription.endpoint, success: true };
      } catch (error) {
        const statusCode = error?.statusCode ?? 500;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        }

        return {
          endpoint: subscription.endpoint,
          success: false,
          statusCode,
          message: error?.message ?? 'Unknown push error',
        };
      }
    }),
  );

  return results.map((entry) => entry.status === 'fulfilled' ? entry.value : { success: false, message: String(entry.reason) });
}

export async function alreadyDispatched(dispatchType: string, dedupeKey: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('notification_dispatch_log')
    .select('id')
    .eq('dispatch_type', dispatchType)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();

  return Boolean(data);
}

export async function markDispatched(dispatchType: string, dedupeKey: string, payload: Record<string, unknown>) {
  const supabase = createAdminClient();
  await supabase
    .from('notification_dispatch_log')
    .insert({
      dispatch_type: dispatchType,
      dedupe_key: dedupeKey,
      payload,
    });
}
