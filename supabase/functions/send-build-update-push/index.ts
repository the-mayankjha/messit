import {
  createAdminClient,
  sendPushToSubscriptions,
  alreadyDispatched,
  markDispatched,
  createCorsPreflightResponse,
  createJsonResponse,
} from '../_shared/push.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse(origin);
  }

  if (req.method !== 'POST') {
    return createJsonResponse({ error: 'Method not allowed' }, { status: 405 }, origin);
  }

  const body = await req.json();
  const version = body.version as string;
  const buildDate = body.buildDate as string | undefined;
  const url = body.url || '/';
  const dedupeKey = `build:${version}`;

  if (!version) {
    return createJsonResponse({ error: 'version is required' }, { status: 400 }, origin);
  }

  if (await alreadyDispatched('build_update', dedupeKey)) {
    return createJsonResponse({ success: true, skipped: true, reason: 'already_dispatched' }, { status: 200 }, origin);
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, notification_mode');

  if (error) {
    return createJsonResponse({ error: error.message }, { status: 500 }, origin);
  }

  const siteUrl = Deno.env.get('SITE_URL') || 'https://messy-phi.vercel.app';

  // Group subscriptions by persona
  const groups: Record<string, any[]> = {
    normal: [],
    stud: [],
    princess: [],
  };

  (subscriptions || []).forEach(sub => {
    const mode = sub.notification_mode || 'normal';
    if (groups[mode]) groups[mode].push(sub);
    else groups.normal.push(sub);
  });

  const allResults: any[] = [];

  for (const [mode, subs] of Object.entries(groups)) {
    if (subs.length === 0) continue;

    const prefix = mode === 'stud' ? '💪 Bro! 🔥' : mode === 'princess' ? '✨ For You, Princess... 🎀' : '🚀';
    const vibratePattern = mode === 'stud' ? [500, 110, 500, 110, 450] : mode === 'princess' ? [100, 50, 100, 50, 100, 50, 100] : [200, 100, 200];

    const groupPayload = {
      title: `${prefix} v${version} is Ready!`,
      body: `A fresh Messit build${buildDate ? ` from ${buildDate}` : ''} is ready with premium updates. Grab it now!`,
      tag: `messit-build-${version}`,
      url,
      icon: `${siteUrl}/icon.png`,
      badge: `${siteUrl}/icon.png`,
      image: `${siteUrl}/icon.png`,
      requireInteraction: true,
      vibrate: vibratePattern,
      data: { type: 'build_update', version },
    };

    const groupResults = await sendPushToSubscriptions(subs, groupPayload);
    allResults.push(...groupResults);
  }

  await markDispatched('build_update', dedupeKey, { version });

  return createJsonResponse({ success: true, sent: allResults.length, results: allResults }, { status: 200 }, origin);
});
