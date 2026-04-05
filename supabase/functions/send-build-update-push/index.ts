import { createAdminClient, sendPushToSubscriptions, alreadyDispatched, markDispatched } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const version = body.version as string;
  const buildDate = body.buildDate as string | undefined;
  const url = body.url || '/';
  const dedupeKey = `build:${version}`;

  if (!version) {
    return Response.json({ error: 'version is required' }, { status: 400 });
  }

  if (await alreadyDispatched('build_update', dedupeKey)) {
    return Response.json({ success: true, skipped: true, reason: 'already_dispatched' });
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const payload = {
    title: `Latest update ${version} available`,
    body: `A newer Messit build${buildDate ? ` from ${buildDate}` : ''} is ready. Open the app and update now.`,
    tag: `messit-build-${version}`,
    url,
    data: { type: 'build_update', version },
  };

  const results = await sendPushToSubscriptions(subscriptions ?? [], payload);
  await markDispatched('build_update', dedupeKey, payload);

  return Response.json({ success: true, sent: results.length, results });
});
