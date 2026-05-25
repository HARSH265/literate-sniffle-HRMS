import { Router } from 'express';
import { attendanceQRController } from './attendanceQR.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { checkInSchema, checkOutSchema } from './attendanceQR.validation.js';

const router = Router();

router.post('/check-in', validate(checkInSchema), attendanceQRController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceQRController.checkOut);

export default router;
