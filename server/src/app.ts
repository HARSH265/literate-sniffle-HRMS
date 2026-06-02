import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import expressMongoSanitize from 'express-mongo-sanitize';
import { RateLimiterDynamic } from './core/cache/RateLimiterDynamic.js';
import { RedisService } from './core/redis/redis.service.js';
import { randomUUID } from 'crypto';
import { requestLogger } from './core/middleware/requestLogger.js';
import { errorHandler } from './core/errors/errorHandler.js';
import { env } from './config/env.js';
import { authenticateApiKey } from './core/permissions/apiKeyAuth.middleware.js';

// Enforce a strict CORS whitelist in non‑development environments
if (env.NODE_ENV !== 'development') {
  // allowedOrigins is derived from CLIENT_URL – ensure it does not contain a wildcard
  if (!env.allowedOrigins.length || env.allowedOrigins.includes('*')) {
    throw new Error('CORS configuration error: In production you must provide a non‑wildcard CLIENT_URL (comma‑separated list)');
  }
}

import { auditMiddleware } from './core/audit/AuditMiddleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import departmentRoutes from './modules/departments/departments.routes.js';
import designationRoutes from './modules/designations/designations.routes.js';
import shiftRoutes from './modules/shifts/shifts.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import holidayRoutes from './modules/holidays/holidays.routes.js';
import weeklyOffRuleRoutes from './modules/weekly-off-rules/weeklyOffRules.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import attendanceQRRoutes from './modules/attendance-qr/attendanceQR.routes.js';
import kioskRoutes from './modules/kiosk/kiosk.routes.js';
import totpRoutes from './modules/totp/totp.routes.js';
import overtimeRuleRoutes from './modules/overtime-rules/overtimeRules.routes.js';
import overtimeEntryRoutes from './modules/overtime-entries/overtimeEntries.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import leaveRoutes from './modules/leave/leave.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import salarySlipRoutes from './modules/salary-slips/salarySlips.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import loanRoutes from './modules/loans/loans.routes.js';
import statutoryRoutes from './modules/statutory/statutory.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import essRoutes from './modules/ess/ess.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import helpdeskRoutes from './modules/helpdesk/helpdesk.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import shiftSwapRoutes from './modules/shift-swap/shiftSwap.routes.js';
import performanceRoutes from './modules/performance/performance.routes.js';
import trainingRoutes from './modules/training/training.routes.js';
import apiKeyRoutes from './modules/api-keys/api-keys.routes.js';
import permissionsRoutes from './modules/permissions/permissions.routes.js';

const app = express();

// Timeout handled per-route via DB socketTimeoutMS (env.DB_SOCKET_TIMEOUT_MS)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));
app.use(
  cors({
    origin: env.NODE_ENV === 'development'
      ? true
      : env.allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(expressMongoSanitize());
app.use(compression());
app.use(morgan('short'));

// Request‑ID middleware – adds X-Request-Id header for tracing
app.use((req, res, next) => {
  const requestId = randomUUID();
  // Attach to request object (TS ignore)
  (req as any).requestId = requestId;
  // Expose to client via response header
  res.setHeader('X-Request-Id', requestId);
  next();
});
app.use(requestLogger);

const authLimiter = new RateLimiterDynamic({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_ENABLED ? 10 : 100000,
  keyPrefix: 'auth',
  blockDurationMs: 5 * 60 * 1000,
});

const generalLimiter = new RateLimiterDynamic({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_ENABLED ? 100 : 100000,
  keyPrefix: 'general',
});

if (env.RATE_LIMIT_ENABLED) {
  app.use('/api/v1/auth', RateLimiterDynamic.middleware(authLimiter));
  app.use('/api/v1', RateLimiterDynamic.middleware(generalLimiter));
}

app.use(authenticateApiKey);

app.get('/api/v1/health', async (_req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memUsage = process.memoryUsage();

    let redisStatus = 'unavailable';
    try {
      const redis = await RedisService.getClient();
      await redis.ping();
      redisStatus = 'connected';
    } catch { /* Redis not available */ }

    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        uptime: process.uptime(),
        database: dbState,
        redis: redisStatus,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    res.status(503).json({ success: false, message: 'Health check failed' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/users', auditMiddleware, userRoutes);
app.use('/api/v1/departments', auditMiddleware, departmentRoutes);
app.use('/api/v1/designations', auditMiddleware, designationRoutes);
app.use('/api/v1/shifts', auditMiddleware, shiftRoutes);
app.use('/api/v1/employees', auditMiddleware, employeeRoutes);
app.use('/api/v1/holidays', auditMiddleware, holidayRoutes);
app.use('/api/v1/weekly-off-rules', auditMiddleware, weeklyOffRuleRoutes);
app.use('/api/v1/attendance', auditMiddleware, attendanceRoutes);
app.use('/api/v1/attendance/qr', auditMiddleware, attendanceQRRoutes);
app.use('/api/v1/kiosk', auditMiddleware, kioskRoutes);
app.use('/api/v1/totp', auditMiddleware, totpRoutes);
app.use('/api/v1/overtime-rules', auditMiddleware, overtimeRuleRoutes);
app.use('/api/v1/overtime-entries', auditMiddleware, overtimeEntryRoutes);
app.use('/api/v1/settings', auditMiddleware, settingsRoutes);
app.use('/api/v1/leave', auditMiddleware, leaveRoutes);
app.use('/api/v1/payroll', auditMiddleware, payrollRoutes);
app.use('/api/v1/salary-slips', auditMiddleware, salarySlipRoutes);
app.use('/api/v1/reports', auditMiddleware, reportsRoutes);
app.use('/api/v1/loans', auditMiddleware, loanRoutes);
app.use('/api/v1/statutory', auditMiddleware, statutoryRoutes);
app.use('/api/v1/notifications', auditMiddleware, notificationsRoutes);
app.use('/api/v1/ess', auditMiddleware, essRoutes);
app.use('/api/v1/announcements', auditMiddleware, announcementRoutes);
app.use('/api/v1/helpdesk', auditMiddleware, helpdeskRoutes);
app.use('/api/v1/assets', auditMiddleware, assetRoutes);
app.use('/api/v1/documents', auditMiddleware, documentRoutes);
app.use('/api/v1/shift-swaps', auditMiddleware, shiftSwapRoutes);
app.use('/api/v1/performance', auditMiddleware, performanceRoutes);
app.use('/api/v1/training', auditMiddleware, trainingRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/permissions', auditMiddleware, permissionsRoutes);

app.use(errorHandler);

export default app;