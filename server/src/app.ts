import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import expressMongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './core/errors/errorHandler.js';
import { env } from './config/env.js';
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
import overtimeRuleRoutes from './modules/overtime-rules/overtimeRules.routes.js';
import overtimeEntryRoutes from './modules/overtime-entries/overtimeEntries.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import salarySlipRoutes from './modules/salary-slips/salarySlips.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

dotenv.config();

const app = express();

app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({
      success: false,
      message: 'Request timed out',
      errors: [],
    });
  });
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(expressMongoSanitize());
app.use(compression());
app.use(morgan('short'));

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later', errors: [] },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later', errors: [] },
});

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

app.get('/api/v1/health', async (_req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memUsage = process.memoryUsage();
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        uptime: process.uptime(),
        database: dbState,
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
app.use('/api/v1/users', auditMiddleware, userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/weekly-off-rules', weeklyOffRuleRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/overtime-rules', overtimeRuleRoutes);
app.use('/api/v1/overtime-entries', overtimeEntryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/salary-slips', salarySlipRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

app.use(errorHandler);

export default app;