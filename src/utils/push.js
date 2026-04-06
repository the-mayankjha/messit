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

export function updatePushDebug(partial) {
  if (typeof window === 'undefined') return;

  const current = {
    ...(window.__messitPushDebug || {}),
    ...partial,
  };
  
  window.__messitPushDebug = current;
  localStorage.setItem('messit-push-debug', JSON.stringify(current));
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

function areKeysEqual(key1, key2) {
  if (!key1 || !key2) return false;
  if (key1.byteLength !== key2.byteLength) return false;
  const a = new Uint8Array(key1);
  const b = new Uint8Array(key2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export async function subscribeToPushNotifications() {
  updatePushDebug({ stage: 'start', lastError: null });

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser.');
    updatePushDebug({ stage: 'unsupported', reason: 'unsupported' });
    return { success: false, reason: 'unsupported' };
  }

  if (!window.isSecureContext) {
    console.warn('Push notifications require a secure context (HTTPS or localhost).');
    updatePushDebug({ stage: 'blocked', reason: 'insecure_context' });
    return { success: false, reason: 'insecure_context' };
  }

  if (!PUBLIC_VAPID_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY is not defined in environment.');
    updatePushDebug({ stage: 'blocked', reason: 'missing_vapid_key' });
    return { success: false, reason: 'missing_vapid_key' };
  }

  // Basic validation of VAPID key format (base64url)
  if (PUBLIC_VAPID_KEY.length < 40) {
    console.error('VITE_VAPID_PUBLIC_KEY looks invalid (too short).');
    updatePushDebug({ stage: 'blocked', reason: 'invalid_vapid_key' });
    return { success: false, reason: 'invalid_vapid_key' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    updatePushDebug({ stage: 'service_worker_ready', serviceWorkerActive: !!registration.active });
    
    let subscription = await registration.pushManager.getSubscription();
    
    // VAPID KEY MIGRATION: 403 FIX
    // If a subscription already exists, we must ensure it matches our current PUBLIC_VAPID_KEY.
    if (subscription && PUBLIC_VAPID_KEY) {
      const currentKey = subscription.options.applicationServerKey;
      const expectedKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      
      if (!areKeysEqual(currentKey, expectedKey)) {
        console.warn('VAPID key mismatch detected. Forcing re-subscription for self-healing...');
        updatePushDebug({ stage: 'key_mismatch_detected' });
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      updatePushDebug({ stage: 'registering_new' });
      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    updatePushDebug({ 
      stage: 'registered', 
      hasSubscription: true,
      endpointPreview: subscription?.endpoint?.slice(0, 48) || null,
    });

    return { success: true, subscription };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    const errorName = error?.name || 'UnknownError';
    
    console.error('Push Subscription Error:', errorName, errorMsg);
    
    updatePushDebug({
      stage: 'error',
      reason: 'subscription_failed',
      error: errorMsg,
      errorName: errorName,
      lastError: errorMsg
    });
    
    return {
      success: false,
      reason: 'subscription_failed',
      error: errorMsg,
      errorName: errorName
    };
  }
}

export async function unsubscribeFromPushNotifications() {
  updatePushDebug({ stage: 'unsubscribing' });
  
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      updatePushDebug({ stage: 'unsubscribed_skipped', reason: 'no_subscription' });
      return { success: true, subscription: null };
    }

    await subscription.unsubscribe();
    updatePushDebug({ stage: 'unsubscribed_success' });
    return { success: true, subscription: null };
  } catch (error) {
    updatePushDebug({ stage: 'unsubscribe_error', error: error?.message });
    return { success: false, reason: 'unsubscribe_failed', error: error?.message };
  }
}
