/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    const rawText = event.data?.text() || 'Check Messit for updates.';
    payload = {
      title: 'Messit Update',
      body: rawText,
    };
  }

  const origin = self.location.origin;
  const title = payload.title || 'Messit Notification';
  
  // Ensure we use absolute paths from our own origin for icons/badges
  // This is critical on iOS/Android when the app is closed.
  const options = {
    body: payload.body || 'You have a new update in the mess.',
    icon: payload.icon || `${origin}/icon.png`,
    badge: payload.badge || `${origin}/icon.png`,
    tag: payload.tag || 'messit-push-default',
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of windowClients) {
      if ('focus' in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }

    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  })());
});
