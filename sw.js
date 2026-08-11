// ============================================================
// 📡 SENDLY SERVICE WORKER - Place in ROOT
// ============================================================
const CACHE_NAME = 'sendly-cache-v1';

self.addEventListener('install', event => {
    console.log('[Sendly SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('[Sendly SW] Activating...');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
    console.log('[Sendly SW] Push received:', event);

    let notificationData = {
        title: '🔔 Sendly Notification',
        body: 'You have a new update!',
        icon: '/sendly-notification/icon-192x192.png',
        badge: '/sendly-notification/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: '/' },
        actions: [
            { action: 'open', title: '📖 View' },
            { action: 'dismiss', title: '❌ Dismiss' }
        ]
    };

    if (event.data) {
        try {
            const parsedData = event.data.json();
            notificationData = { ...notificationData, ...parsedData };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(
            notificationData.title,
            {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                vibrate: notificationData.vibrate,
                data: notificationData.data,
                actions: notificationData.actions,
                tag: 'sendly-notification',
                renotify: true,
                requireInteraction: true
            }
        )
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

console.log('[Sendly SW] Service Worker loaded!');
