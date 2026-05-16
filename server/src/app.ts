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
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import departmentRoutes from './modules/departments/departments.routes.js';
import designationRoutes from './modules/designations/designations.routes.js';
import shiftRoutes from './modules/shifts/shifts.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';

dotenv.config();

const app = express();

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

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: { uptime: process.uptime() },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/employees', employeeRoutes);

app.use(errorHandler);

export default app;