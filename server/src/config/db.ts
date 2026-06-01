import mongoose from 'mongoose';
import { logger } from '../core/logger/logger.js';
import { createMissingIndexes } from './indexes.js';
import { env } from '../config/env.js';

const { MONGODB_URI } = env;

export async function connectDatabase(): Promise<void> {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI, {
    maxPoolSize: env.DB_MAX_POOL,
    minPoolSize: env.DB_MIN_POOL,
    serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: env.DB_SOCKET_TIMEOUT_MS,
  });

    logger.info('MongoDB connected successfully');
await createMissingIndexes();
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});