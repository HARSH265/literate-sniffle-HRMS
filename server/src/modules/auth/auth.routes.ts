import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { loginSchema, changePasswordSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, unlockAccountSchema } from './auth.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all-devices', authenticate, authController.logoutAllDevices);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/unlock-account', authenticate, authorize('manage-users'), validate(unlockAccountSchema), authController.unlockAccount);

export default router;