import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createAttendanceEntrySchema, bulkAttendanceSchema } from './attendance.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-employees'), attendanceController.list);
router.get('/monthly-view', authorize('view-employees'), attendanceController.monthlyView);
router.post('/bulk', authorize('manage-attendance'), validate(bulkAttendanceSchema), attendanceController.bulkCreate);
router.post('/', authorize('manage-attendance'), validate(createAttendanceEntrySchema), attendanceController.create);
router.patch('/:id', authorize('manage-attendance'), attendanceController.update);
router.delete('/:id', authorize('manage-attendance'), attendanceController.remove);

export default router;