import { Router } from 'express';
import { leaveController } from './leave.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  createLeaveTypeSchema, updateLeaveTypeSchema,
  createLeaveApplicationSchema, approveLeaveSchema, bulkAccrueSchema,
} from './leave.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/types', authorize('view-leave'), leaveController.listLeaveTypes);
router.post('/types', authorize('manage-leave-types'), validate(createLeaveTypeSchema), leaveController.createLeaveType);
router.patch('/types/:id', authorize('manage-leave-types'), validate(updateLeaveTypeSchema), leaveController.updateLeaveType);
router.delete('/types/:id', authorize('manage-leave-types'), leaveController.deleteLeaveType);

router.get('/applications', authorize('view-leave'), leaveController.listApplications);
router.get('/applications/my', authorize('view-leave'), leaveController.getMyApplications);
router.post('/applications', authorize('manage-leave-applications'), validate(createLeaveApplicationSchema), leaveController.createApplication);
router.patch('/applications/:id/cancel', authorize('manage-leave-applications'), leaveController.cancelApplication);
router.post('/applications/approve', authorize('approve-leave'), validate(approveLeaveSchema), leaveController.approveApplication);
router.get('/approvals/pending', authorize('approve-leave'), leaveController.getPendingApprovals);

router.get('/balances/:employeeId', authorize('view-leave'), leaveController.getBalances);
router.get('/balances/my', authorize('view-leave'), leaveController.getMyBalances);
router.post('/accrue', authorize('manage-leave-types'), validate(bulkAccrueSchema), leaveController.accrueLeave);

router.get('/calendar', authorize('view-leave'), leaveController.getCalendar);
router.get('/summary', authorize('view-leave'), leaveController.getLeaveSummary);

export default router;
