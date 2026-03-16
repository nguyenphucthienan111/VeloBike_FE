importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Same config as firebase.ts - hardcode here since service worker can't read env vars
firebase.initializeApp({
  apiKey: "AIzaSyAjcrc8t5LIISa303X00apUFYm-hbrtrNQ",
  authDomain: "velobike-9d912.firebaseapp.com",
  projectId: "velobike-9d912",
  storageBucket: "velobike-9d912.firebasestorage.app",
  messagingSenderId: "682683625862",
  appId: "1:682683625862:web:393f6be8a4eb96baf4bc07",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'VeloBike', {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  });
});
