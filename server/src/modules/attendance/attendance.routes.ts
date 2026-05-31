import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { attendanceController } from './attendance.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createAttendanceEntrySchema, bulkAttendanceSchema } from './attendance.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

const bulkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many bulk requests, try later', errors: [] },
});

router.use(authenticate);

router.get('/', authorize('view-employees'), attendanceController.list);
router.get('/employee/:employeeId', authorize('view-employees'), attendanceController.getByEmployee);
router.get('/monthly-view', authorize('view-employees'), attendanceController.monthlyView);
router.post('/bulk', bulkLimiter, authorize('manage-attendance'), validate(bulkAttendanceSchema), attendanceController.bulkCreate);
router.patch('/bulk-update', bulkLimiter, authorize('manage-attendance'), attendanceController.bulkUpdateEntries);
router.post('/', authorize('manage-attendance'), validate(createAttendanceEntrySchema), attendanceController.create);
router.patch('/:id', authorize('manage-attendance'), attendanceController.update);
router.delete('/:id', authorize('manage-attendance'), attendanceController.remove);

export default router;