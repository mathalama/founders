import { precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';

// Precaching automatically injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST || []);

// This tells Workbox to serve index.html for all navigation requests,
// EXCEPT for those starting with /api
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    /^\/api/
  ]
});
registerRoute(navigationRoute);

// Handle Web Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle Notification Clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the URL associated with the notification
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
