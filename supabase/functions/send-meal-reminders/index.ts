import {
  createAdminClient,
  sendPushToSubscriptions,
  alreadyDispatched,
  markDispatched,
  createCorsPreflightResponse,
  createJsonResponse,
} from '../_shared/push.ts';

const MEAL_WINDOWS = [
  { name: 'Breakfast', key: 'breakfast', hour: 7, minute: 10 },
  { name: 'Lunch', key: 'lunch', hour: 12, minute: 25 },
  { name: 'Snacks', key: 'snacks', hour: 16, minute: 40 },
  { name: 'Dinner', key: 'dinner', hour: 19, minute: 10 },
];

/**
 * Get the current time in Asia/Kolkata (IST)
 */
function getIndiaTime() {
  const now = new Date();
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const indiaTime = new Date(now.getTime() + istOffset);
  return indiaTime;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse(origin);
  }

  if (req.method !== 'POST') {
    return createJsonResponse({ error: 'Method not allowed' }, { status: 405 }, origin);
  }

  const indiaTime = getIndiaTime();
  const currentHour = indiaTime.getUTCHours();
  const currentMinute = indiaTime.getUTCMinutes();
  
  // Find if any meal window matches the current minute
  const meal = MEAL_WINDOWS.find((entry) => 
    entry.hour === currentHour && entry.minute === currentMinute
  );

  if (!meal) {
    return createJsonResponse({ 
      success: true, 
      skipped: true, 
      reason: 'no_meal_due',
      timeSearched: `${currentHour}:${currentMinute} IST` 
    }, { status: 200 }, origin);
  }

  const dateString = indiaTime.toISOString().split('T')[0];
  const dedupeKey = `${dateString}:${meal.key}`;
  
  if (await alreadyDispatched('meal_reminder', dedupeKey)) {
    return createJsonResponse({ success: true, skipped: true, reason: 'already_dispatched' }, { status: 200 }, origin);
  }

  const dayOfMonth = indiaTime.getUTCDate().toString();
  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, hostel, mess_type, email, notification_mode');

  if (error) {
    return createJsonResponse({ error: error.message }, { status: 500 }, origin);
  }

  if (!subscriptions || subscriptions.length === 0) {
    return createJsonResponse({ success: true, sent: 0, reason: 'no_subscriptions' }, { status: 200 }, origin);
  }

  // Cache menus by hostel:messType
  const menuCache = new Map<string, any>();
  
  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    const hostel = subscription.hostel?.startsWith('MH') ? 'MH' : subscription.hostel?.startsWith('LH') ? 'LH' : subscription.hostel;
    const messType = subscription.mess_type;

    if (!hostel || !messType) return { success: false, reason: 'missing_profile_data' };

    const cacheKey = `${hostel}:${messType}`;
    let menuData = menuCache.get(cacheKey);

    if (menuData === undefined) {
      const { data } = await supabase
        .from('mess_menus')
        .select('menu_data')
        .eq('hostel', hostel)
        .eq('mess_type', messType)
        .maybeSingle();
      
      menuData = data?.menu_data || null;
      menuCache.set(cacheKey, menuData);
    }

    if (!menuData) return { success: false, reason: 'no_menu_found' };

    const items = menuData[dayOfMonth]?.[meal.key] || [];
    const siteUrl = Deno.env.get('SITE_URL') || 'https://messy-phi.vercel.app'; // Fallback to production URL

    const persona = subscription.notification_mode || 'stud';
    let titleStr = `🍽️ ${meal.name} Time!`;
    let bodyStr = items.length > 0 
      ? `${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}` 
      : `Hey! ${meal.name} is being served at the mess. Don't miss out!`;

    let vibratePattern = [200, 100, 200]; // Normal

    if (persona === 'princess') {
      titleStr = `Your Meal Awaits, Princess ✨`;
      bodyStr = items.length > 0
        ? `A delicious ${meal.name.toLowerCase()} is ready: ${items.slice(0, 3).join(', ')}... Treat yourself! 🎀`
        : `It's time for a lovely ${meal.name.toLowerCase()}. You deserve a wonderful meal! 🎀`;
      vibratePattern = [100, 50, 100, 50, 100, 50, 100]; // Melodic
    } else if (persona === 'stud') {
      titleStr = `Yo Bro, Fuel Up! 🥩`;
      bodyStr = items.length > 0
        ? `Protein alert! ${meal.name} menu: ${items.slice(0, 2).join(', ')} and more. Get it now! 🔥`
        : `Your ${meal.name.toLowerCase()} fuel is ready at the mess. Go grab it! 🔥`;
      vibratePattern = [500, 110, 500, 110, 450]; // Heavy
    }

    const payload = {
      title: titleStr,
      body: bodyStr,
      tag: `messit-meal-${meal.key}-${dateString}`,
      url: '/',
      icon: `${siteUrl}/pwa-192x192.png`,
      badge: `${siteUrl}/favicon.png`,
      image: items.length > 0 ? `${siteUrl}/images/meal-generic.jpg` : undefined,
      vibrate: vibratePattern,
      requireInteraction: true,
      actions: [{ action: 'open', title: 'Open Dashboard' }],
      data: { type: 'meal_reminder', meal: meal.key },
    };

    const sent = await sendPushToSubscriptions([subscription], payload);
    return sent[0];
  }));

  const successfulCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
  await markDispatched('meal_reminder', dedupeKey, { meal: meal.key, sentTotal: successfulCount });

  return createJsonResponse({ 
    success: true, 
    sent: successfulCount, 
    meal: meal.key,
    results 
  }, { status: 200 }, origin);
});
