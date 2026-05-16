import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { loginSchema, changePasswordSchema } from './auth.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;