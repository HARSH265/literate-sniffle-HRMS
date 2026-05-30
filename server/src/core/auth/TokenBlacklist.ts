import NodeCache from 'node-cache';

const blacklist = new NodeCache({ stdTTL: 24 * 60 * 60 });

export class TokenBlacklist {
  static add(token: string, ttlSeconds: number = 3600): void {
    blacklist.set(token, true, ttlSeconds);
  }

  static isBlacklisted(token: string): boolean {
    return blacklist.has(token);
  }

  static remove(token: string): void {
    blacklist.del(token);
  }
}
