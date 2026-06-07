import { RedisService } from '../redis/redis.service.js';
import { logger } from '../logger/logger.js';

const PREFIX = 'hrms:cache:';

export class RedisCacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await RedisService.getClient();
      const raw = await redis.get(`${PREFIX}${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.error(`Redis cache get error for key ${key}:`, err);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const redis = await RedisService.getClient();
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.setEx(`${PREFIX}${key}`, ttlSeconds, serialized);
      } else {
        await redis.set(`${PREFIX}${key}`, serialized);
      }
    } catch (err) {
      logger.error(`Redis cache set error for key ${key}:`, err);
    }
  }

  static async invalidate(key: string): Promise<void> {
    try {
      const redis = await RedisService.getClient();
      await redis.del(`${PREFIX}${key}`);
    } catch (err) {
      logger.error(`Redis cache invalidate error for key ${key}:`, err);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = await RedisService.getClient();
      const keys = await redis.keys(`${PREFIX}${pattern}`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      logger.error(`Redis cache invalidatePattern error for ${pattern}:`, err);
    }
  }

  static async flush(): Promise<void> {
    try {
      const redis = await RedisService.getClient();
      const keys = await redis.keys(`${PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      logger.error('Redis cache flush error:', err);
    }
  }

  static async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await RedisCacheService.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await RedisCacheService.set(key, value, ttlSeconds);
    return value;
  }
}
