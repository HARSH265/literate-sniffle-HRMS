import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.get);
router.patch('/', settingsController.update);

export default router;