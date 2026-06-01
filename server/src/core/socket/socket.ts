import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import KioskDevice from '../../models/KioskDevice.model.js';
import { env } from '../../config/env.js';
import { TokenBlacklist } from '../auth/TokenBlacklist.js';
import { logger } from '../logger/logger.js';
// Optional Redis adapter for Socket.io clustering
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

let io: Server;
let pubClient: ReturnType<typeof createClient> | null = null;
let subClient: ReturnType<typeof createClient> | null = null;

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
      credentials: true,
    },
  });
  // If a Redis server URL is configured, set up the Redis adapter.
  // This enables Socket.io to broadcast events across multiple Node.js processes.
  if (env.REDIS_URL) {
    pubClient = createClient({ url: env.REDIS_URL });
    subClient = pubClient.duplicate();

    // Connect both clients. Errors are logged but do not prevent the server from starting.
    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io?.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.io Redis adapter initialized');
      })
      .catch((err) => {
        logger.error('Failed to initialize Redis adapter for Socket.io:', err);
      });
  }

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
  // Helper to enforce role‑based access on socket events
  const hasRole = (allowed: string[]) => {
    const user = (socket as any).user as { role: string } | undefined;
    return user && allowed.includes(user.role);
  };

  // Generic guard – reject any event if the socket is not authenticated
  socket.use((packet, next) => {
    if (!(socket as any).user) {
      logger.warn(`Unauthenticated socket attempted event ${packet[0]}`);
      return next(new Error('Authentication required'));
    }
    next();
  });

  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-kiosk', (kioskId: string) => {
    // Example: only admins or super‑admins can join kiosk rooms
    if (!hasRole(['super-admin', 'hr-admin', 'admin'])) {
      logger.warn(`Socket ${socket.id} unauthorized to join kiosk ${kioskId}`);
      return socket.emit('error', 'Unauthorized');
    }
    socket.join(`kiosk:${kioskId}`);
  });

  socket.on('leave-kiosk', (kioskId: string) => {
    if (!hasRole(['super-admin', 'hr-admin', 'admin'])) {
      logger.warn(`Socket ${socket.id} unauthorized to leave kiosk ${kioskId}`);
      return socket.emit('error', 'Unauthorized');
    }
    socket.leave(`kiosk:${kioskId}`);
  });

  socket.on('kiosk-ping', async (kioskId: string) => {
    if (!hasRole(['super-admin', 'hr-admin', 'admin'])) {
      logger.warn(`Socket ${socket.id} unauthorized to ping kiosk ${kioskId}`);
      return socket.emit('error', 'Unauthorized');
    }
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

  // End of connection handler
});


  return io;
}

/**
 * Gracefully shuts down the Socket.io server and any connected Redis clients.
 */
export async function closeSocket(): Promise<void> {
  try {
    if (io) {
      await new Promise<void>((resolve, reject) => {
        io.close((err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('Socket.io server closed');
    }
    if (pubClient) {
      await pubClient.quit();
      logger.info('Socket.io Redis pub client closed');
    }
    if (subClient) {
      await subClient.quit();
      logger.info('Socket.io Redis sub client closed');
    }
  } catch (err) {
    logger.error('Error during Socket.io shutdown:', err);
  }
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
