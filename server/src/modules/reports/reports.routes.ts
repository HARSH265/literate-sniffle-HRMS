import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/employees', authorize('view-reports'), reportsController.exportEmployees);
router.get('/attendance', authorize('view-reports'), reportsController.exportAttendance);
router.get('/payroll', authorize('view-reports'), reportsController.exportPayroll);

export default router;