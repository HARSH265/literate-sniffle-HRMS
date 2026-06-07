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

// ── Admin/HR routes (manage employees) ──
router.get('/stats', authorize('manage-employees'), essController.getStats);
router.get('/change-requests/all', authorize('manage-employees'), essController.getAllChangeRequests);
router.patch('/change-requests/:id/approve', authorize('manage-employees'), validate(approveChangeRequestSchema), essController.approveChange);
router.patch('/change-requests/:id/reject', authorize('manage-employees'), validate(rejectChangeRequestSchema), essController.rejectChange);

// ── Employee Self-Service routes (own data only) ──
// Profile
router.get('/profile', authorize('view-own-profile'), essController.getProfile);
router.put('/profile', authorize('update-own-profile'), validate(updateProfileSchema), essController.updateProfile);

// Attendance
router.get('/attendance', authorize('view-own-profile'), essController.getMyAttendance);

// Leave
router.get('/leave/balances', authorize('view-own-profile'), essController.getMyLeaveBalances);
router.get('/leave/applications', authorize('view-own-profile'), essController.getMyLeaveApplications);

// Documents
router.get('/documents', authorize('view-own-profile'), essController.getMyDocuments);

// Assets
router.get('/assets', authorize('view-own-profile'), essController.getMyAssets);

// Payslips
router.get('/payslips', authorize('view-own-profile'), essController.getMyPayslips);

// Loans (read + apply)
router.get('/loans', authorize('view-own-profile'), essController.getMyLoans);
router.get('/loan-types', authorize('view-own-profile'), essController.getLoanTypesForEss);
router.post('/loans', authorize('apply-loan'), essController.applyLoanFromEss);
router.get('/loans/:id', authorize('view-own-profile'), essController.getLoanDetailForEss);
router.post('/loans/:id/cancel', authorize('apply-loan'), essController.cancelLoanFromEss);

// Change requests (employee can view own + create new)
router.get('/change-requests', authorize('view-own-profile'), essController.getChangeRequests);
router.post('/change-requests', authorize('update-own-profile'), validate(createChangeRequestSchema), essController.createChangeRequest);

export default router;
