import { createContext, useContext, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const ws = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    let reconnectTimeout = null;

    const connect = () => {
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
          } else if (data.type === 'typing') {
            window.dispatchEvent(new CustomEvent('user_typing', { detail: { senderId: data.senderId } }));
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
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    };
  }, [user]);

  const sendJsonMessage = (msg) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  };

  return (
    <SocketContext.Provider value={{ sendJsonMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

// Utility function
export function urlBase64ToUint8Array(base64String) {
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
