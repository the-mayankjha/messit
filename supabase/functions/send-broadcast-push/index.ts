import { createAdminClient, sendPushToSubscriptions, markDispatched } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const announcementId = body.announcementId;
  const title = body.title;
  const content = body.content;
  const url = body.url || '/';

  if (!announcementId || !title || !content) {
    return Response.json({ error: 'announcementId, title and content are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
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

  return Response.json({ success: true, sent: results.length, results });
});
