import { createClient, RedisClientType } from 'redis';
import { env } from '../../config/env.js';

/**
 * Simple singleton wrapper for a Redis client.
 * Connects on first import. The client is shared across the application.
 */
export class RedisService {
  private static client: RedisClientType<any, any> | null = null;

  static async getClient(): Promise<RedisClientType<any, any>> {
    if (this.client && this.client.isOpen) {
      return this.client;
    }
    const url = env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL not configured');
    }
    this.client = createClient({ url });
    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
    await this.client.connect();
    return this.client;
  }
}
