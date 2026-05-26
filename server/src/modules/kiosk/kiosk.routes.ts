import { Router } from 'express';
import { kioskController } from './kiosk.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { registerKioskSchema, kioskIdParamSchema, validateQRQuerySchema } from './kiosk.validation.js';

const router = Router();

router.get('/devices', authenticate, authorize('manage-attendance'), kioskController.list);
router.post('/devices', authenticate, authorize('manage-attendance'), validate(registerKioskSchema), kioskController.register);
router.get('/qr/validate', validate(validateQRQuerySchema, 'query'), kioskController.validate);
router.get('/:kioskId/qr/public', validate(kioskIdParamSchema, 'params'), kioskController.qr);
router.get('/:kioskId/qr', authenticate, authorize('manage-attendance'), validate(kioskIdParamSchema, 'params'), kioskController.qr);
router.post('/:kioskId/broadcast', authenticate, authorize('manage-attendance'), validate(kioskIdParamSchema, 'params'), kioskController.startBroadcast);

export default router;
