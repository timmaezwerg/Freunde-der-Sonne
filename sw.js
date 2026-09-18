/* =========================================================
   Freunde der Sonne - Service Worker for iOS & Web Push
   ========================================================= */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push Notification from Apple APNs / WebPush
self.addEventListener('push', (event) => {
  let data = {
    title: 'Freunde der Sonne ☀️',
    body: 'Ein Spieltag wurde aktualisiert!',
    url: '/'
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || 'Freunde der Sonne ☀️';
  const options = {
    body: data.body || 'Neues Spieltag-Update verfügbar.',
    icon: '/assets/app_icon.jpg',
    badge: '/assets/app_icon.jpg',
    vibrate: [150, 80, 150],
    tag: data.tag || 'fds-event-update',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// When user taps on notification on iPhone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
