import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import KioskDevice from '../../models/KioskDevice.model.js';

let io: Server;

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
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

    socket.on('kiosk-ping', async (kioskId: string) => {
      try {
        const isObjectId = mongoose.Types.ObjectId.isValid(kioskId);
        const filter = isObjectId ? { _id: kioskId } : { deviceCode: kioskId };
        await KioskDevice.updateOne(filter, { lastSeenAt: new Date() });
      } catch {
        // silent
      }
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
