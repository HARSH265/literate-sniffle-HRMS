import { Router } from 'express';
import { totpController } from './totp.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/enroll', authorize('manage-employees'), totpController.enroll);
router.post('/verify', authorize('view-employees'), totpController.verify);
router.post('/disable', authorize('manage-employees'), totpController.disable);

export default router;
