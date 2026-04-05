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
    .select('endpoint, p256dh, auth');

  if (error) {
    return createJsonResponse({ error: error.message }, { status: 500 }, origin);
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

  return createJsonResponse({ success: true, sent: results.length, results }, { status: 200 }, origin);
});
