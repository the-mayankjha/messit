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

  if (!announcementId || !title || !content) {
    return createJsonResponse({ error: 'announcementId, title and content are required' }, { status: 400 }, origin);
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error) {
    return createJsonResponse({ error: error.message }, { status: 500 }, origin);
  }

  const payload = {
    title: `📢 ${title}`,
    body: content,
    tag: `messit-announcement-${announcementId}`,
    url,
    data: { type: 'broadcast', announcementId },
  };

  const results = await sendPushToSubscriptions(subscriptions ?? [], payload);
  await markDispatched('broadcast', `announcement:${announcementId}`, payload);

  return createJsonResponse({ success: true, sent: results.length, results }, { status: 200 }, origin);
});
