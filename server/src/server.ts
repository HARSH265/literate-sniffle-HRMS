import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './core/logger/logger.js';
import { initSocket, closeSocket } from './core/socket/socket.js';
import { announcementService } from './modules/announcements/announcement.service.js';

async function startServer() {
  await connectDatabase();

  // Try to bind the HTTP server. If the default port is already in use,
  // increment the port number (up to a few attempts) so the process can start.
  let port = env.PORT;
  const maxPortAttempts = 5;
  let server: any;
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      server = await new Promise<import('http').Server>((resolve, reject) => {
        const srv = app.listen(port, () => {
          logger.info(`Server running on port ${port} in ${env.NODE_ENV} mode`);
          resolve(srv);
        });
        srv.on('error', (err: any) => reject(err));
      });
      break; // success
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} already in use – trying ${port + 1}`);
        port++;
      } else {
        throw err; // re‑throw unexpected errors
      }
    }
  }
  if (!server) {
    throw new Error('Failed to bind to a free port after multiple attempts');
  }

  // Initialize Socket.io with the server instance
  initSocket(server);
  logger.info('Socket.io initialized');

  setInterval(async () => {
    try {
      const count = await announcementService.processScheduled();
      if (count > 0) logger.info(`Processed ${count} scheduled announcements`);
    } catch (err) {
      logger.error('Failed to process scheduled announcements:', err);
    }
  }, 60_000);

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeSocket();
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});