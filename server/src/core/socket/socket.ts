import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import KioskDevice from '../../models/KioskDevice.model.js';
import { env } from '../../config/env.js';
import { TokenBlacklist } from '../auth/TokenBlacklist.js';
import { logger } from '../logger/logger.js';

let io: Server;

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }

    if (await TokenBlacklist.isBlacklisted(token)) {
      return next(new Error('Token has been revoked'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

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
      } catch (err) {
        logger.error('Kiosk ping error:', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
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
