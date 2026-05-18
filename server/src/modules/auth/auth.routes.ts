import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from './auth.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all-devices', authenticate, authController.logoutAllDevices);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;