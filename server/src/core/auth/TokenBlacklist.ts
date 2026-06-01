import { RedisService } from '../redis/redis.service.js';

export class TokenBlacklist {
  /** Add a token to the blacklist with an optional TTL (seconds). */
  static async add(token: string, ttlSeconds: number = 24 * 60 * 60): Promise<void> {
    const client = await RedisService.getClient();
    await client.set(token, '1', { EX: ttlSeconds });
  }

  /** Check if a token is currently blacklisted. */
  static async isBlacklisted(token: string): Promise<boolean> {
    const client = await RedisService.getClient();
    const exists = await client.exists(token);
    return exists === 1;
  }

  /** Remove a token from the blacklist. */
  static async remove(token: string): Promise<void> {
    const client = await RedisService.getClient();
    await client.del(token);
  }
}
