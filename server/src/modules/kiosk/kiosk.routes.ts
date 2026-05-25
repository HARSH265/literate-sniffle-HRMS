import { Router } from 'express';
import { kioskController } from './kiosk.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.get('/devices', authenticate, authorize('manage-attendance'), kioskController.list);
router.post('/devices', authenticate, authorize('manage-attendance'), kioskController.register);
router.get('/qr/validate', kioskController.validate);
router.get('/:kioskId/qr/public', kioskController.qr);
router.get('/:kioskId/qr', authenticate, authorize('manage-attendance'), kioskController.qr);
router.post('/:kioskId/broadcast', authenticate, authorize('manage-attendance'), kioskController.startBroadcast);

export default router;
