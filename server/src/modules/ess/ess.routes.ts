import { Router } from 'express';
import { essController } from './ess.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  updateProfileSchema,
  createChangeRequestSchema,
  approveChangeRequestSchema,
  rejectChangeRequestSchema,
} from './ess.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize('manage-employees'), essController.getStats);
router.get('/profile', authorize('view-own-profile'), essController.getProfile);
router.put('/profile', authorize('update-own-profile'), validate(updateProfileSchema), essController.updateProfile);
router.get('/attendance', authorize('view-own-profile'), essController.getMyAttendance);
router.get('/leave/balances', authorize('view-own-profile'), essController.getMyLeaveBalances);
router.get('/leave/applications', authorize('view-own-profile'), essController.getMyLeaveApplications);
router.get('/documents', authorize('view-own-profile'), essController.getMyDocuments);
router.get('/assets', authorize('view-own-profile'), essController.getMyAssets);
router.get('/payslips', authorize('view-own-profile'), essController.getMyPayslips);
router.get('/change-requests', authorize('view-own-profile'), essController.getChangeRequests);
router.get('/change-requests/all', authorize('manage-employees'), essController.getAllChangeRequests);
router.post('/change-requests', authorize('update-own-profile'), validate(createChangeRequestSchema), essController.createChangeRequest);
router.patch('/change-requests/:id/approve', authorize('manage-employees'), validate(approveChangeRequestSchema), essController.approveChange);
router.patch('/change-requests/:id/reject', authorize('manage-employees'), validate(rejectChangeRequestSchema), essController.rejectChange);

export default router;
