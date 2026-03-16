import { useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../firebase';
import { API_BASE_URL } from '../constants';

export const useFCM = () => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const setup = async () => {
      const fcmToken = await requestNotificationPermission();
      if (!fcmToken) return;

      // Send token to BE
      await fetch(`${API_BASE_URL}/users/me/fcm-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fcmToken }),
      });
    };

    setup();

    // Handle foreground notifications (app is open)
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    });

    return () => unsubscribe();
  }, []);
};
