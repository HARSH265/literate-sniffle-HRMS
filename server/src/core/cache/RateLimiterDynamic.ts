import { RedisService } from '../redis/redis.service.js';
import { logger } from '../logger/logger.js';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
  blockDurationMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const BLOCK_PREFIX = 'rl:block:';
const COUNT_PREFIX = 'rl:count:';

export class RateLimiterDynamic {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      blockDurationMs: config.windowMs,
      ...config,
    };
  }

  async check(key: string): Promise<RateLimitResult> {
    try {
      const redis = await RedisService.getClient();
      const now = Date.now();
      const blockKey = `${BLOCK_PREFIX}${this.config.keyPrefix}:${key}`;
      const countKey = `${COUNT_PREFIX}${this.config.keyPrefix}:${key}`;

      const isBlocked = await redis.get(blockKey);
      if (isBlocked) {
        const ttl = await redis.ttl(blockKey);
        return {
          allowed: false,
          remaining: 0,
          resetAt: now + ttl * 1000,
        };
      }

      const current = await redis.incr(countKey);
      if (current === 1) {
        await redis.pExpire(countKey, this.config.windowMs);
      }

      if (current > this.config.max) {
        await redis.set(blockKey, '1', { PX: this.config.blockDurationMs });
        await redis.del(countKey);
        const blockTtl = await redis.ttl(blockKey);
        return {
          allowed: false,
          remaining: 0,
          resetAt: now + blockTtl * 1000,
        };
      }

      const ttl = await redis.pTTL(countKey);
      return {
        allowed: true,
        remaining: Math.max(0, this.config.max - current),
        resetAt: now + (ttl > 0 ? ttl : this.config.windowMs),
      };
    } catch (err) {
      logger.error('Rate limiter error:', err);
      return { allowed: true, remaining: this.config.max, resetAt: Date.now() + this.config.windowMs };
    }
  }

  async reset(key: string): Promise<void> {
    try {
      const redis = await RedisService.getClient();
      await redis.del(`${BLOCK_PREFIX}${this.config.keyPrefix}:${key}`);
      await redis.del(`${COUNT_PREFIX}${this.config.keyPrefix}:${key}`);
    } catch (err) {
      logger.error('Rate limiter reset error:', err);
    }
  }

  static middleware(limiter: RateLimiterDynamic) {
    return async (req: any, res: any, next: any) => {
      const key = req.ip || req.connection?.remoteAddress || 'unknown';
      const result = await limiter.check(key);

      res.setHeader('X-RateLimit-Limit', limiter.config.max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          errors: [],
        });
      }

      next();
    };
  }
}
