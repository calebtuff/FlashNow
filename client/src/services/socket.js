import { io } from 'socket.io-client';

let socket = null;

function getSocketUrl() {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return String(envUrl);
  }
  return undefined;
}

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}
