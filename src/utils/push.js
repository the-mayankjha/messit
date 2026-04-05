const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();

if (typeof window !== 'undefined') {
  window.__messitPushDebug = {
    ...(window.__messitPushDebug || {}),
    secureContext: window.isSecureContext,
    vapidPresent: Boolean(PUBLIC_VAPID_KEY),
    vapidLength: PUBLIC_VAPID_KEY?.length || 0,
    origin: window.location.origin,
    protocol: window.location.protocol,
    stage: 'module_loaded',
  };
}

function updatePushDebug(partial) {
  if (typeof window === 'undefined') return;

  window.__messitPushDebug = {
    ...(window.__messitPushDebug || {}),
    secureContext: window.isSecureContext,
    vapidPresent: Boolean(PUBLIC_VAPID_KEY),
    vapidLength: PUBLIC_VAPID_KEY?.length || 0,
    origin: window.location.origin,
    protocol: window.location.protocol,
    ...partial,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function subscribeToPushNotifications() {
  updatePushDebug({ stage: 'start' });

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    updatePushDebug({ stage: 'unsupported', reason: 'unsupported' });
    return { success: false, reason: 'unsupported' };
  }

  if (!window.isSecureContext) {
    updatePushDebug({ stage: 'blocked', reason: 'insecure_context' });
    return { success: false, reason: 'insecure_context' };
  }

  if (!PUBLIC_VAPID_KEY) {
    updatePushDebug({ stage: 'blocked', reason: 'missing_vapid_key' });
    return { success: false, reason: 'missing_vapid_key' };
  }

  if (PUBLIC_VAPID_KEY.length < 40) {
    updatePushDebug({ stage: 'blocked', reason: 'invalid_vapid_key' });
    return { success: false, reason: 'invalid_vapid_key' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    updatePushDebug({ stage: 'service_worker_ready', serviceWorkerReady: true });
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      updatePushDebug({ stage: 'subscribing' });
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    updatePushDebug({
      stage: 'subscribed',
      hasSubscription: Boolean(subscription),
      endpointPreview: subscription?.endpoint?.slice(0, 48) || null,
    });

    return { success: true, subscription };
  } catch (error) {
    updatePushDebug({
      stage: 'error',
      reason: 'subscription_failed',
      error: error?.message || String(error),
      errorName: error?.name || 'UnknownError',
    });
    return {
      success: false,
      reason: 'subscription_failed',
      error: error?.message || String(error),
    };
  }
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { success: true, subscription: null };
  }

  await subscription.unsubscribe();
  return { success: true, subscription: null };
}
