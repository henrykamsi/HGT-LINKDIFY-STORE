// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging (FCM) Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyBFtAVBpkzjVkkI_Xnu9wfALxDwuG3LXAM",
    authDomain: "hgt-linkdify.firebaseapp.com",
    projectId: "hgt-linkdify",
    storageBucket: "hgt-linkdify.firebasestorage.app",
    messagingSenderId: "990084898335",
    appId: "1:990084898335:web:ad1117316a12ca98363f2a",
    measurementId: "G-G3STNFS21P"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('[Service Worker] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'HGT Store Update';
    const notificationBody = payload.notification?.body || 'New app update available!';
    const notificationIcon = payload.notification?.icon || 'https://cdn.phototourl.com/free/2026-07-17-b874fac5-0508-4a4e-8fdc-6dbf329a31ae.jpg';
    const appId = payload.data?.appId || '';
    const clickAction = payload.fcmOptions?.link || '/';

    const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: notificationIcon,
        vibrate: [200, 100, 200, 100, 200],
        data: {
            appId: appId,
            url: clickAction,
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: '📱 Open App' },
            { action: 'update', title: '🔄 Update Now' },
            { action: 'dismiss', title: '✕ Dismiss' }
        ],
        requireInteraction: true,
        tag: 'hgt-store-update-' + appId,
        renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};
    const appId = data.appId || '';
    const url = data.url || '/';

    notification.close();

    if (action === 'open' || action === 'update') {
        event.waitUntil(
            clients.openWindow('/?appId=' + appId)
        );
    } else if (action === 'dismiss') {
        // Just close
    } else {
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

// Install event
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});