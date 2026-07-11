import { useEffect, useRef } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../api/client';
import toast from 'react-hot-toast';

export const useRealtime = () => {
  const ws = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let reconnectTimeout = null;

    const connect = () => {
      const wsUrl = API_BASE_URL.replace('http', 'ws') + `/api/ws?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            if (!window.location.pathname.includes(`/messages/${data.message.senderId}`)) {
              toast.success(`Новое сообщение!\n\n${data.message.content}`, {
                duration: 4000,
                icon: '💬',
              });
            }
            window.dispatchEvent(new CustomEvent('new_message', { detail: data.message }));
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    // Register Push Subscription
    const registerPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        
        const registration = await navigator.serviceWorker.ready;
        
        // Wait for permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!VAPID_PUBLIC_KEY) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Send to backend
        await fetchWithAuth('/api/notifications/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription),
        });
      } catch (error) {
        console.error('Error registering push:', error);
      }
    };

    registerPush();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws.current) {
        // Remove onclose so it doesn't trigger reconnect when unmounting
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, []);

  return ws;
};

// Utility function
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
