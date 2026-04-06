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
  const title = payload.title || 'Messit Update 📡';
  
  // Construct options with all rich features
  const options = {
    body: payload.body || 'New update available in your mess dashboard.',
    icon: payload.icon || `${origin}/pwa-192x192.png`,
    badge: payload.badge || `${origin}/favicon.png`,
    image: payload.image || null,
    tag: payload.tag || 'messit-push-default',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'View Update' }
    ]
  };

  // SUPER SAFE DISPLAY: If rich notification fails, fall back to basic
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch((err) => {
        console.error('Rich notification failed, falling back:', err);
        return self.registration.showNotification(title, {
          body: payload.body || 'New update available.',
          icon: `${origin}/icon.png`,
          data: { url: payload.url || '/' }
        });
      })
  );
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
