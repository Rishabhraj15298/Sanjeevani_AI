import { io } from 'socket.io-client';

let socket;

export function ensureSocket() {
  if (socket && socket.connected) return socket;
  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  socket = io(API, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => console.log('[socket] connected', socket.id));
  socket.on('connect_error', (e) => console.warn('[socket] connect_error', e.message));
  socket.on('reconnect_attempt', (n)=> console.log('[socket] reconnect_attempt', n));
  return socket;
}

export function getSocket() {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
}

export function requestDoctorSync() {
  return new Promise((resolve) => {
    const s = ensureSocket();
    s.emit('doctor:sync', (res) => resolve(res));
  });
}
