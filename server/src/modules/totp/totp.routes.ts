import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { totpController } from './totp.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { enrollSchema, verifySchema, disableSchema } from './totp.validation.js';

const router = Router();

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many verify attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

router.post('/enroll', authorize('manage-employees'), validate(enrollSchema), totpController.enroll);
router.post('/verify', verifyLimiter, authorize('view-employees'), validate(verifySchema), totpController.verify);
router.post('/disable', authorize('manage-employees'), validate(disableSchema), totpController.disable);

export default router;
