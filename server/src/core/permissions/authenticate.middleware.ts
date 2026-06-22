import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';
import { TokenBlacklist } from '../auth/TokenBlacklist.js';
import { logger } from '../logger/logger.js';
import { AUTH_CONSTANTS } from '../../modules/auth/auth.constants.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId?: string | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined;

    if (req.cookies?.[AUTH_CONSTANTS.cookieNames.jwt]) {
      token = req.cookies[AUTH_CONSTANTS.cookieNames.jwt];
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    try {
      if (await TokenBlacklist.isBlacklisted(token)) {
        throw new AppError('Token has been revoked', 401);
      }
    } catch (err) {
      logger.error('Token blacklist check failed:', err);
      // Treat as revoked to prevent token misuse if blacklist unavailable
      throw new AppError('Token has been revoked', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;
    req.user = decoded;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else if (err.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else {
      logger.error('Authentication error:', err);
      next(new AppError('Invalid token', 401));
    }
  }
}
