/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';


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
    (async () => {
      // 1. Log receipt for debugging in Health Check
      try {
        const lastRec = { title, receivedAt: new Date().toISOString() };
        // We can't use localStorage in SW, we must use IndexedDB or caches
        const cache = await caches.open('messit-push-debug');
        await cache.put('/last-push', new Response(JSON.stringify(lastRec)));
      } catch (e) {
        console.error('Debug log failed:', e);
      }

      // 2. Show the actual notification
      try {
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.error('Rich notification failed, falling back:', err);
        await self.registration.showNotification(title, {
          body: payload.body || 'New update available.',
          icon: `${origin}/icon.png`,
          data: { url: payload.url || '/' }
        });
      }
    })()
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
