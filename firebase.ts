import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

// Get these from Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<string> => {
  // Use redirect on deployed environments to avoid CORS/popup issues
  const isLocalhost = window.location.hostname === 'localhost';
  if (isLocalhost) {
    const result = await signInWithPopup(auth, googleProvider);
    return await result.user.getIdToken();
  } else {
    await signInWithRedirect(auth, googleProvider);
    return ''; // redirect will handle the rest
  }
};

export const getGoogleRedirectResult = async (): Promise<string | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) return await result.user.getIdToken();
    return null;
  } catch { return null; }
};

// VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    // Register SW manually and inject config via query params
    const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
    const swRegistration = await navigator.serviceWorker.register(swUrl);

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });
    console.log('[FCM] Token:', token);
    return token;
  } catch (err) {
    console.error('[FCM] Error getting token:', err);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};
