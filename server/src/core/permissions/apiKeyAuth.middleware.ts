import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../../modules/api-keys/api-keys.service.js';
import { RateLimiterDynamic } from '../cache/RateLimiterDynamic.js';
import { AppError } from '../errors/AppError.js';

const apiKeyLimiters = new Map<string, RateLimiterDynamic>();

function getLimiter(rateLimit: number): RateLimiterDynamic {
  const key = `apikey:${rateLimit}`;
  if (!apiKeyLimiters.has(key)) {
    apiKeyLimiters.set(key, new RateLimiterDynamic({
      windowMs: 60 * 1000,
      max: rateLimit,
      keyPrefix: key,
    }));
  }
  return apiKeyLimiters.get(key)!;
}

export async function authenticateApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token.startsWith('hrms_')) {
        const keyData = await ApiKeyService.validateKey(token);
        if (!keyData) {
          throw new AppError('Invalid or expired API key', 401);
        }

        const limiter = getLimiter(keyData.rateLimit);
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const result = await limiter.check(ip);

        if (!result.allowed) {
          _res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
          throw new AppError('API key rate limit exceeded', 429);
        }

        req.user = {
          id: `apikey:${keyData.id}`,
          email: 'api-key',
          name: 'API Key',
          role: 'api',
        };

        (req as any).apiKey = keyData;
        (req as any).isApiKeyAuth = true;
        return next();
      }
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('API key authentication failed', 401));
    }
  }
}

export function requireApiKeyPermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const keyData = (req as any).apiKey;
    if (!keyData) {
      return next(new AppError('API key required', 401));
    }

    const hasPermission = requiredPermissions.some(p => keyData.permissions.includes(p));
    if (!hasPermission) {
      return next(new AppError('Insufficient API key permissions', 403));
    }

    next();
  };
}
