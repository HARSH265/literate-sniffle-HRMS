import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/employees', reportsController.exportEmployees);
router.get('/attendance', reportsController.exportAttendance);
router.get('/payroll', reportsController.exportPayroll);

export default router;