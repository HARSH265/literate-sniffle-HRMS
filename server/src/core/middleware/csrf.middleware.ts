import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXCLUDED_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/health'];

function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

function hashCode(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (CSRF_EXCLUDED_PATHS.some(p => req.path.startsWith(p))) {
    return next();
  }

  if (SAFE_METHODS.has(req.method)) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.setHeader('X-CSRF-Token', token);
    return next();
  }

  const submittedToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  const cookieToken = req.cookies[CSRF_COOKIE_NAME] as string | undefined;

  if (!submittedToken || !cookieToken) {
    res.status(403).json({ success: false, message: 'CSRF token missing' });
    return;
  }

  if (hashCode(submittedToken) !== hashCode(cookieToken)) {
    res.status(403).json({ success: false, message: 'CSRF token mismatch' });
    return;
  }

  const newToken = generateToken();
  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.setHeader('X-CSRF-Token', newToken);

  next();
}
