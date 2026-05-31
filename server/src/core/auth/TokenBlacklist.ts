import { TokenBlacklistModel } from '../../models/TokenBlacklist.model.js';

export class TokenBlacklist {
  /** Add a token to the blacklist with an optional TTL (seconds). */
  static async add(token: string, ttlSeconds: number = 24 * 60 * 60): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    try {
      await TokenBlacklistModel.create({ token, expiresAt });
    } catch (e) {
      // Duplicate token – ignore
    }
  }

  /** Check if a token is currently blacklisted. */
  static async isBlacklisted(token: string): Promise<boolean> {
    const doc = await TokenBlacklistModel.findOne({ token }).lean();
    return !!doc;
  }

  /** Remove a token from the blacklist. */
  static async remove(token: string): Promise<void> {
    await TokenBlacklistModel.deleteOne({ token });
  }
}
