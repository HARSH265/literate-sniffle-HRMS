import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), settingsController.get);
router.patch('/', authorize('manage-settings'), settingsController.update);

export default router;