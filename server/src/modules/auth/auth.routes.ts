import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { loginSchema, changePasswordSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, unlockAccountSchema, forceChangePasswordSchema } from './auth.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests from this IP, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', passwordResetRateLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all-devices', authenticate, authController.logoutAllDevices);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/force-change-password', authenticate, validate(forceChangePasswordSchema), authController.forceChangePassword);
router.post('/unlock-account', authenticate, authorize('manage-users'), validate(unlockAccountSchema), authController.unlockAccount);

export default router;