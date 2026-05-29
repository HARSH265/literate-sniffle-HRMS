import { Router } from 'express';
import { shiftSwapController } from './shiftSwap.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { requestSwapSchema, updateSwapSchema, approveSwapSchema, setPreferenceSchema } from './shiftSwap.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-shift-swaps'), shiftSwapController.list);
router.get('/my', authorize('view-own-shifts'), shiftSwapController.getMySwaps);
router.get('/pending', authorize('manage-shift-swaps'), shiftSwapController.getPendingApprovals);
router.get('/eligibility', authorize('view-own-shifts'), shiftSwapController.checkEligibility);
router.get('/preferences', authorize('view-own-shifts'), shiftSwapController.getPreference);
router.put('/preferences', authorize('request-shift-swap'), validate(setPreferenceSchema), shiftSwapController.setPreference);
router.get('/:id', authorize('view-shift-swaps'), shiftSwapController.getById);
router.post('/', authorize('request-shift-swap'), validate(requestSwapSchema), shiftSwapController.requestSwap);
router.post('/:id/approve', authorize('manage-shift-swaps'), shiftSwapController.approveSwap);
router.post('/:id/reject', authorize('manage-shift-swaps'), validate(approveSwapSchema), shiftSwapController.rejectSwap);
router.post('/:id/cancel', authorize('request-shift-swap'), shiftSwapController.cancelSwap);
router.put('/:id', authorize('request-shift-swap'), validate(updateSwapSchema), shiftSwapController.updateSwap);

export default router;
