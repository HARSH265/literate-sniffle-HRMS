import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createAttendanceEntrySchema, bulkAttendanceSchema } from './attendance.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', attendanceController.list);
router.get('/monthly-view', attendanceController.monthlyView);
router.post('/bulk', validate(bulkAttendanceSchema), attendanceController.bulkCreate);
router.post('/', validate(createAttendanceEntrySchema), attendanceController.create);
router.patch('/:id', attendanceController.update);
router.delete('/:id', attendanceController.remove);

export default router;