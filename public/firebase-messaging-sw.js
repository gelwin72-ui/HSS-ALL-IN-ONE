/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging Service Worker for HSS ALL IN ONE
// Supports both root '/' domain and GitHub Pages base path '/HSS-ALL-IN-ONE/'

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase compat app for service worker
firebase.initializeApp({
  apiKey: "AIzaSyCs2H0N2c4kz9RvNOBlfTplxLGYMfnY6IU",
  projectId: "hss-all-in-one",
  messagingSenderId: "978993384932",
  appId: "1:978993384932:web:8d841a6bb5e840f1910bf1"
});

const messaging = firebase.messaging();

// Helper to determine active base path
function getBasePath() {
  if (self.location.pathname.includes('/HSS-ALL-IN-ONE/')) {
    return '/HSS-ALL-IN-ONE/';
  }
  return '/';
}

// Background push notification event handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const basePath = getBasePath();
  const title = payload.notification?.title || payload.data?.title || 'HSS ALL IN ONE Notification';
  const body = payload.notification?.body || payload.data?.body || 'You have a new update from school.';
  
  // Resolve icon and badge respecting base path
  const iconUrl = payload.notification?.icon || payload.data?.icon || (self.location.origin + basePath + 'icon-192.png');
  const badgeUrl = payload.data?.badge || (self.location.origin + basePath + 'favicon-32x32.png');
  const targetUrl = payload.data?.url || payload.data?.click_action || (self.location.origin + basePath);
  const category = payload.data?.category || 'school_notices';

  const notificationOptions = {
    body: body,
    icon: iconUrl,
    badge: badgeUrl,
    tag: payload.data?.tag || `hss-${Date.now()}`,
    data: {
      url: targetUrl,
      category: category,
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Notification click handler: focuses existing window or opens target deep link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || (self.location.origin + getBasePath());

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already an open window for this origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // If already on the page, navigate or post message and focus
          if ('navigate' in client && targetUrl !== client.url) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no open client found, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
