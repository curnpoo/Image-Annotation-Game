/// <reference lib="webworker" />
// Custom Service Worker combining PWA (Workbox) + Firebase Cloud Messaging
// This file is used as the source for vite-plugin-pwa

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;
declare const firebase: any;

// Standard PWA precaching
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache Google fonts
registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            })
        ]
    })
);

// Skip waiting and claim clients immediately
self.skipWaiting();
clientsClaim();

// ============================================
// FIREBASE CLOUD MESSAGING
// ============================================

// Import Firebase scripts for messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyBAsWPf3QS-9GNalh_JC2KDW_58IsX3S4U",
    authDomain: "image-annotation-game.firebaseapp.com",
    projectId: "image-annotation-game",
    storageBucket: "image-annotation-game.firebasestorage.app",
    messagingSenderId: "875626942936",
    appId: "1:875626942936:web:7197de17608976e3d762ad"
});

const messaging = firebase.messaging();

// Handle background push messages
// Handle background push messages
messaging.onBackgroundMessage((payload: any) => {
    console.log('[SW] Received background message:', payload);

    // CRITICAL FIX: iOS & Android automatically display notifications if the payload
    // contains a "notification" block.
    // We only need to manually show a notification if it's a "data-only" message.
    if (payload.notification) {
        // console.log('[SW] Payload has "notification" block. forcing manual display to ensure visibility.');
        console.log('[SW] Payload has "notification" block - letting OS handle display to prevent duplicates.');
        return;
    }

    const notificationTitle = payload.data?.title || payload.notification?.title || 'ANO Game';
    const roomCode = payload.data?.roomCode;
    const clickUrl = payload.data?.click_action || (roomCode ? `/?invite=${roomCode}` : '/');
    
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || 'You have a new notification!',
        icon: '/pwa-icon.png',
        badge: '/pwa-icon.png',
        tag: payload.data?.type || 'game-notification',
        data: {
            ...payload.data,
            click_action: clickUrl,
            roomCode: roomCode
        },
        vibrate: [100, 50, 100],
        requireInteraction: true
    } as NotificationOptions;

    console.log('[SW] Showing manual notification for data-only payload:', notificationOptions.data);
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    const notifData = event.notification.data;
    const roomCode = notifData?.roomCode;
    const notifType = notifData?.type;
    
    console.log('[SW] Notification type:', notifType, 'roomCode:', roomCode);

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and send a message (no page refresh!)
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    const windowClient = client as WindowClient;
                    windowClient.focus();
                    
                    // Post message to the app instead of navigating
                    // This avoids a full page refresh
                    windowClient.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        notificationType: notifType,
                        roomCode: roomCode,
                        data: notifData
                    });
                    
                    console.log('[SW] Posted message to client instead of navigating');
                    return;
                }
            }
            
            // No window open - open a new one with the join URL
            if (self.clients.openWindow && roomCode) {
                console.log('[SW] Opening new window with join URL');
                return self.clients.openWindow(`/?invite=${roomCode}`);
            } else if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

console.log('[SW] Custom service worker with FCM support loaded');

