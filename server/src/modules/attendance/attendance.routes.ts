import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { attendanceController } from './attendance.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createAttendanceEntrySchema, updateAttendanceEntrySchema, idParamSchema, listAttendanceQuerySchema, monthlyViewQuerySchema, adminCheckoutBodySchema, bulkAttendanceSchema, bulkUpdateAttendanceSchema } from './attendance.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import Employee from '../../models/Employee.model.js';

const router = Router();

const bulkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many bulk requests, try later', errors: [] },
});

router.use(authenticate);

router.get('/', authorize('view-employees'), validate(listAttendanceQuerySchema, 'query'), attendanceController.list);
router.get('/employee/:employeeId', authorize('view-employees'), authorizeOwnership({ model: Employee, ownerField: '_id', paramName: 'employeeId' }), attendanceController.getByEmployee);
router.get('/monthly-view', authorize('view-employees'), validate(monthlyViewQuerySchema, 'query'), attendanceController.monthlyView);
router.post('/bulk', bulkLimiter, authorize('manage-attendance'), validate(bulkAttendanceSchema), attendanceController.bulkCreate);
router.patch('/bulk-update', bulkLimiter, authorize('manage-attendance'), validate(bulkUpdateAttendanceSchema), attendanceController.bulkUpdateEntries);
router.post('/admin-checkout/:employeeId', authorize('manage-attendance'), validate(adminCheckoutBodySchema), authorizeOwnership({ model: Employee, ownerField: '_id', paramName: 'employeeId' }), attendanceController.adminCheckout);
router.post('/', authorize('manage-attendance'), validate(createAttendanceEntrySchema), attendanceController.create);
router.patch('/:id', authorize('manage-attendance'), validate(updateAttendanceEntrySchema), attendanceController.update);
router.delete('/:id', authorize('manage-attendance'), validate(idParamSchema, 'params'), attendanceController.remove);

export default router;