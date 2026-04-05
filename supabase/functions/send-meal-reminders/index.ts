import { createAdminClient, sendPushToSubscriptions, alreadyDispatched, markDispatched } from '../_shared/push.ts';

const MEAL_WINDOWS = [
  { name: 'Breakfast', key: 'breakfast', hour: 7, minute: 10 },
  { name: 'Lunch', key: 'lunch', hour: 12, minute: 25 },
  { name: 'Snacks', key: 'snacks', hour: 16, minute: 40 },
  { name: 'Dinner', key: 'dinner', hour: 19, minute: 10 },
];

function getIndiaNow() {
  const now = new Date();
  const india = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return india;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const now = getIndiaNow();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const meal = MEAL_WINDOWS.find((entry) => entry.hour === currentHour && entry.minute === currentMinute);

  if (!meal) {
    return Response.json({ success: true, skipped: true, reason: 'no_meal_due' });
  }

  const dedupeKey = `${now.toISOString().slice(0, 10)}:${meal.key}`;
  if (await alreadyDispatched('meal_reminder', dedupeKey)) {
    return Response.json({ success: true, skipped: true, reason: 'already_dispatched' });
  }

  const dayOfMonth = String(now.getDate());
  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, hostel, mess_type, email');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const uniqueMenus = new Map<string, any>();
  for (const subscription of subscriptions ?? []) {
    const hostel = subscription.hostel?.startsWith('MH') ? 'MH' : subscription.hostel?.startsWith('LH') ? 'LH' : subscription.hostel;
    const messType = subscription.mess_type;
    if (!hostel || !messType) continue;
    uniqueMenus.set(`${hostel}:${messType}`, { hostel, messType });
  }

  const menuCache = new Map<string, any>();
  for (const { hostel, messType } of uniqueMenus.values()) {
    const { data: menu } = await supabase
      .from('mess_menus')
      .select('menu_data')
      .eq('hostel', hostel)
      .eq('mess_type', messType)
      .maybeSingle();

    if (menu?.menu_data) {
      menuCache.set(`${hostel}:${messType}`, menu.menu_data);
    }
  }

  const validSubscriptions = (subscriptions ?? []).filter((subscription) => {
    const hostel = subscription.hostel?.startsWith('MH') ? 'MH' : subscription.hostel?.startsWith('LH') ? 'LH' : subscription.hostel;
    return hostel && subscription.mess_type && menuCache.has(`${hostel}:${subscription.mess_type}`);
  });

  const results = await Promise.all(validSubscriptions.map(async (subscription) => {
    const hostel = subscription.hostel.startsWith('MH') ? 'MH' : subscription.hostel.startsWith('LH') ? 'LH' : subscription.hostel;
    const menu = menuCache.get(`${hostel}:${subscription.mess_type}`);
    const items = menu?.[dayOfMonth]?.[meal.key] ?? [];

    const payload = {
      title: `${meal.name} is being served`,
      body: items.length > 0 ? items.slice(0, 3).join(', ') : `Your ${meal.name.toLowerCase()} is ready at the mess.`,
      tag: `messit-meal-${meal.key}-${dayOfMonth}`,
      url: '/',
      data: { type: 'meal_reminder', meal: meal.key },
    };

    const sent = await sendPushToSubscriptions([subscription], payload);
    return sent[0];
  }));

  await markDispatched('meal_reminder', dedupeKey, { meal: meal.key, sent: results.length });
  return Response.json({ success: true, sent: results.length, results });
});
