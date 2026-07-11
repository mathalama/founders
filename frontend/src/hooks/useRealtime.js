import { useEffect, useRef } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../api/client';
import toast from 'react-hot-toast';

export const useRealtime = () => {
  const ws = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      // With HttpOnly cookies, we don't need to pass the token in the URL!
      const wsUrl = API_BASE_URL.replace('http', 'ws') + `/api/ws`;
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
