import NodeCache from 'node-cache';
import { CACHE_KEYS } from './cache.keys.js';
import { env } from '../../config/env.js';

const cache = new NodeCache({
  stdTTL: env.CACHE_TTL,
  checkperiod: env.CACHE_CHECK_PERIOD,
  useClones: false,
});

export class CacheService {
  static get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  }

  static set<T>(key: string, value: T, ttl?: number): boolean {
    return cache.set(key, value, ttl ?? 0);
  }

  static invalidate(key: string): number {
    return cache.del(key);
  }

  static invalidateMany(keys: string[]): number {
    return cache.del(keys);
  }

  static flush(): void {
    cache.flushAll();
  }

  static invalidateDepartments(): void {
    cache.del(CACHE_KEYS.DEPARTMENTS);
  }

  static invalidateDesignations(): void {
    cache.del(CACHE_KEYS.DESIGNATIONS);
  }

  static invalidateShifts(): void {
    cache.del(CACHE_KEYS.SHIFTS);
  }

  static invalidateSettings(): void {
    cache.del(CACHE_KEYS.SETTINGS);
  }

  static invalidateHolidays(): void {
    cache.del(CACHE_KEYS.HOLIDAYS);
  }

  static invalidateWeeklyOffRules(): void {
    cache.del(CACHE_KEYS.WEEKLY_OFF_RULES);
  }

  static invalidateOvertimeRules(): void {
    cache.del(CACHE_KEYS.OVERTIME_RULES);
  }
}

export { CACHE_KEYS };
export { cache };