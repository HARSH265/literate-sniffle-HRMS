import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './core/logger/logger.js';
import { initSocket } from './core/socket/socket.js';

async function startServer() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  initSocket(server);
  logger.info('Socket.io initialized');

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
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