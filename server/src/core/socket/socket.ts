import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-kiosk', (kioskId: string) => {
      socket.join(`kiosk:${kioskId}`);
    });

    socket.on('leave-kiosk', (kioskId: string) => {
      socket.leave(`kiosk:${kioskId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitQR(kioskId: string, qrData: string, expiresAt: number): void {
  if (io) {
    io.to(`kiosk:${kioskId}`).emit('qr-update', { qrData, expiresAt });
  }
}
