import { Router } from 'express';
import { attendanceQRController } from './attendanceQR.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { checkInSchema, checkOutSchema } from './attendanceQR.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { RateLimiterDynamic } from '../../core/cache/RateLimiterDynamic.js';

const router = Router();

// All QR routes require authentication
router.use(authenticate);
router.use(authorize('check-in-out'));

// Rate limit QR check-in/out to prevent TOTP brute-force (10/min per IP)
const qrLimiter = new RateLimiterDynamic({
  windowMs: 60000,
  max: 10,
  keyPrefix: 'qr-check',
});

router.post('/check-in', RateLimiterDynamic.middleware(qrLimiter), validate(checkInSchema), attendanceQRController.checkIn);
router.post('/check-out', RateLimiterDynamic.middleware(qrLimiter), validate(checkOutSchema), attendanceQRController.checkOut);

export default router;
