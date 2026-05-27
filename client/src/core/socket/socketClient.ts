import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getServerUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  if (base.startsWith('http')) {
    return new URL(base).origin;
  }
  return window.location.origin;
}

let pingTimer: ReturnType<typeof setInterval> | null = null;

export function connectKiosk(kioskId: string): Socket {
  if (socket?.connected) {
    socket.emit('join-kiosk', kioskId);
    return socket;
  }

  socket = io(getServerUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    socket?.emit('join-kiosk', kioskId);
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      socket?.emit('kiosk-ping', kioskId);
    }, 30_000);
  });

  socket.on('disconnect', () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
  });

  return socket;
}

export function disconnectKiosk() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
