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
    payload = {
      title: 'Messit Notification',
      body: event.data?.text() || 'You have a new update.',
    };
  }

  const title = payload.title || 'Messit Notification';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/favicon.png',
    tag: payload.tag || 'messit-push',
    renotify: true,
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
