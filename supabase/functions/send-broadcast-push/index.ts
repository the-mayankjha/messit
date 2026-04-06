import {
  createAdminClient,
  sendPushToSubscriptions,
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
  const announcementId = body.announcementId;
  const title = body.title;
  const content = body.content;
  const url = body.url || '/';
  const targetSubscription = body.targetSubscription;

  if (!announcementId || !title || !content) {
    return createJsonResponse({ error: 'announcementId, title and content are required' }, { status: 400 }, origin);
  }

  const siteUrl = Deno.env.get('SITE_URL') || 'https://messy-phi.vercel.app';

  const payload = {
    title: `📢 ${title}`,
    body: content,
    tag: `messit-announcement-${announcementId}`,
    url,
    icon: `${siteUrl}/icon.png`,
    badge: `${siteUrl}/icon.png`,
    image: `${siteUrl}/icon.png`,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    actions: [{ action: 'open', title: 'View Update' }],
    data: { type: 'broadcast', announcementId },
  };

  // TARGETED PUSH (for testing)
  if (targetSubscription) {
    const persona = targetSubscription.notification_mode || 'normal';
    let titleStr = `📢 ${title}`;
    let vibratePattern = [200, 100, 200];

    if (persona === 'princess') {
      titleStr = `✨ For You, Princess... 🎀 ${title}`;
      vibratePattern = [100, 50, 100, 50, 100, 50, 100];
    } else if (persona === 'stud') {
      titleStr = `💪 Bro! 🔥 ${title}`;
      vibratePattern = [500, 110, 500, 110, 450];
    }

    const payload = {
      title: titleStr,
      body: content,
      tag: `messit-announcement-${announcementId}`,
      url,
      icon: `${siteUrl}/icon.png`,
      badge: `${siteUrl}/icon.png`,
      image: `${siteUrl}/icon.png`,
      requireInteraction: true,
      vibrate: vibratePattern,
      actions: [{ action: 'open', title: 'View Update' }],
      data: { type: 'broadcast', announcementId },
    };

    const results = await sendPushToSubscriptions([targetSubscription], payload);
    return createJsonResponse({ success: true, sent: results.length, results, targeted: true }, { status: 200 }, origin);
  }

  // BROADCAST PUSH (for real updates)
  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, notification_mode');

  if (error) {
    return createJsonResponse({ error: error.message }, { status: 500 }, origin);
  }

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

  // Send to each group with custom tone
  for (const [mode, subs] of Object.entries(groups)) {
    if (subs.length === 0) continue;

    let titleStr = `📢 ${title}`;
    let vibratePattern = [200, 100, 200];

    if (mode === 'princess') {
      titleStr = `✨ For You, Princess... 🎀 ${title}`;
      vibratePattern = [100, 50, 100, 50, 100, 50, 100];
    } else if (mode === 'stud') {
      titleStr = `💪 Bro! 🔥 ${title}`;
      vibratePattern = [500, 110, 500, 110, 450];
    }

    const groupPayload = {
      title: titleStr,
      body: content,
      tag: `messit-announcement-${announcementId}`,
      url,
      icon: `${siteUrl}/icon.png`,
      badge: `${siteUrl}/icon.png`,
      image: `${siteUrl}/icon.png`,
      requireInteraction: true,
      vibrate: vibratePattern,
      actions: [{ action: 'open', title: 'View Update' }],
      data: { type: 'broadcast', announcementId },
    };

    const groupResults = await sendPushToSubscriptions(subs, groupPayload);
    allResults.push(...groupResults);
  }

  await markDispatched('broadcast', `announcement:${announcementId}`, { title, content });

  return createJsonResponse({ success: true, sent: allResults.length, results: allResults }, { status: 200 }, origin);
});
