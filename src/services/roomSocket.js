import { Client } from '@stomp/stompjs';

function endpoint() {
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  const url = new URL('/ws/websocket', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = localStorage.getItem('jwt_token');
  if (!token) throw new Error('Sign in to open the live board.');
  url.searchParams.set('token', token);
  return url.toString();
}

export function connectRoomSocket(roomId, { onEvent, onConnected, onDisconnected, onError }) {
  const client = new Client({
    webSocketFactory: () => new WebSocket(endpoint()),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
  client.onConnect = () => {
    client.subscribe(`/topic/rooms/${roomId}`, message => {
      try { onEvent(JSON.parse(message.body)); }
      catch { onError('A live update could not be read. Reconnecting may recover it.'); }
    });
    onConnected(client);
  };
  client.onWebSocketClose = () => onDisconnected();
  client.onStompError = () => onError('Live board access was denied.');
  client.onWebSocketError = () => onDisconnected();
  client.activate();
  return client;
}
