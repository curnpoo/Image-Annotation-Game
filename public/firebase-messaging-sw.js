// Firebase Cloud Messaging Service Worker
// This handles push notifications when the app is in background or closed

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBAsWPf3QS-9GNalh_JC2KDW_58IsX3S4U",
    authDomain: "image-annotation-game.firebaseapp.com",
    projectId: "image-annotation-game",
    storageBucket: "image-annotation-game.firebasestorage.app",
    messagingSenderId: "875626942936",
    appId: "1:875626942936:web:7197de17608976e3d762ad"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Image Ano Game';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification!',
        icon: '/pwa-icon.png',
        badge: '/pwa-icon.png',
        tag: payload.data?.tag || 'game-notification',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = event.notification.data?.click_action || '/';

            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    // Optional: You could postMessage to the client here to handle navigation
                    // But usually focusing is enough if we rely on the client refreshing or checking state
                    // If we want to force navigation to the invite URL:
                    if (urlToOpen !== '/') {
                        client.navigate(urlToOpen);
                    }
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
