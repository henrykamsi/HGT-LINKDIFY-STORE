// ============================================================
// 📡 SENDLY SERVICE WORKER - Complete Working Version
// ============================================================
// Place this file in your website ROOT directory (next to index.html)
// URL: https://your-website.com/sw.js
// ============================================================

const CACHE_NAME = 'sendly-cache-v1';

// ============================================================
// 1. INSTALL EVENT
// ============================================================
self.addEventListener('install', event => {
    console.log('[Sendly SW] Installing...');
    // Force activation
    self.skipWaiting();
});

// ============================================================
// 2. ACTIVATE EVENT
// ============================================================
self.addEventListener('activate', event => {
    console.log('[Sendly SW] Activating...');
    event.waitUntil(
        clients.claim() // Take control of all pages
    );
});

// ============================================================
// 3. PUSH EVENT - Receives notifications from your server
// ============================================================
self.addEventListener('push', event => {
    console.log('[Sendly SW] 📨 Push notification received!');

    // Default notification data
    let notificationData = {
        title: '🔔 Sendly Notification',
        body: 'You have a new update!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: '📖 View' },
            { action: 'dismiss', title: '❌ Dismiss' }
        ],
        tag: 'sendly-notification',
        renotify: true,
        requireInteraction: true
    };

    // Parse custom data from server if available
    if (event.data) {
        try {
            const parsedData = event.data.json();
            console.log('[Sendly SW] 📦 Parsed data:', parsedData);
            notificationData = { ...notificationData, ...parsedData };
        } catch (e) {
            console.log('[Sendly SW] Using plain text data');
            notificationData.body = event.data.text();
        }
    }

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(
            notificationData.title,
            {
                body: notificationData.body,
                icon: notificationData.icon || '/icon-192x192.png',
                badge: notificationData.badge || '/badge-72x72.png',
                vibrate: notificationData.vibrate || [200, 100, 200],
                data: notificationData.data || { url: '/' },
                actions: notificationData.actions || [
                    { action: 'open', title: 'View' },
                    { action: 'dismiss', title: 'Dismiss' }
                ],
                tag: notificationData.tag || 'sendly-notification',
                renotify: notificationData.renotify !== undefined ? notificationData.renotify : true,
                requireInteraction: notificationData.requireInteraction !== undefined ? notificationData.requireInteraction : true,
                silent: notificationData.silent || false,
                // For Android
                priority: 'high'
            }
        )
        .then(() => {
            console.log('[Sendly SW] ✅ Notification displayed successfully!');
        })
        .catch(error => {
            console.error('[Sendly SW] ❌ Failed to show notification:', error);
        })
    );
});

// ============================================================
// 4. NOTIFICATION CLICK - When user clicks on notification
// ============================================================
self.addEventListener('notificationclick', event => {
    console.log('[Sendly SW] 👆 Notification clicked!');
    console.log('[Sendly SW] Action:', event.action);
    console.log('[Sendly SW] Data:', event.notification.data);

    // Close the notification
    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || '/';

    // Handle different actions
    if (action === 'open' || !action) {
        // User wants to open the app
        console.log('[Sendly SW] 📂 Opening app...');
        
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            })
            .then(windowClients => {
                // Check if there's already a window open
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        console.log('[Sendly SW] ✅ Focusing existing window');
                        return client.focus();
                    }
                }
                // No window open, open a new one
                if (clients.openWindow) {
                    console.log('[Sendly SW] 🪟 Opening new window');
                    return clients.openWindow(urlToOpen);
                }
            })
            .then(() => {
                console.log('[Sendly SW] ✅ App opened successfully!');
            })
            .catch(error => {
                console.error('[Sendly SW] ❌ Failed to open app:', error);
            })
        );
    } else if (action === 'dismiss') {
        console.log('[Sendly SW] 👋 Notification dismissed');
    }
});

// ============================================================
// 5. PUSH SUBSCRIPTION CHANGE - When subscription expires/updates
// ============================================================
self.addEventListener('pushsubscriptionchange', event => {
    console.log('[Sendly SW] 🔄 Push subscription changed!');

    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                'YOUR_VAPID_PUBLIC_KEY_HERE' // Replace with your VAPID public key
            )
        })
        .then(subscription => {
            console.log('[Sendly SW] ✅ New subscription created');
            
            // Send new subscription to your server
            return fetch('https://sendly-notification.onrender.com/api/v1/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-sendly-key': 'YOUR_API_KEY_HERE' // Replace with your API key
                },
                body: JSON.stringify(subscription)
            });
        })
        .then(response => {
            if (response.ok) {
                console.log('[Sendly SW] ✅ Subscription updated on server');
            } else {
                console.error('[Sendly SW] ❌ Failed to update subscription on server');
            }
        })
        .catch(error => {
            console.error('[Sendly SW] ❌ Subscription update failed:', error);
        })
    );
});

// ============================================================
// 6. HELPER FUNCTION - Convert VAPID key
// ============================================================
function urlBase64ToUint8Array(base64String) {
    console.log('[Sendly SW] 🔑 Converting VAPID key...');
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    try {
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        console.log('[Sendly SW] ✅ VAPID key converted successfully');
        return outputArray;
    } catch (error) {
        console.error('[Sendly SW] ❌ Failed to convert VAPID key:', error);
        return new Uint8Array(0);
    }
}

// ============================================================
// 7. PERIODIC CHECK FOR UPDATES
// ============================================================
setInterval(() => {
    console.log('[Sendly SW] ⏰ Checking for updates...');
    self.registration.update()
        .then(() => {
            console.log('[Sendly SW] ✅ Update check completed');
        })
        .catch(() => {
            console.log('[Sendly SW] ⚠️ Update check failed');
        });
}, 3600000); // Check every hour

// ============================================================
// 8. READY - SW is ready to work!
// ============================================================
console.log('✅ ========================================');
console.log('✅ SENDLY SERVICE WORKER IS READY!');
console.log('✅ Version: 1.0.0');
console.log('✅ Status: ✅ Active');
console.log('✅ Features: Push Notifications, Caching, Offline Support');
console.log('✅ ========================================');
