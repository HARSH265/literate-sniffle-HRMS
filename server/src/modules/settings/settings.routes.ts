import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { uploadSettingsLogo } from '../../core/file/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-settings'), settingsController.get);
router.patch('/', authorize('manage-settings'), settingsController.update);
router.post('/test-email', authorize('manage-settings'), settingsController.testEmail);
router.post('/logo', authorize('manage-settings'), uploadSettingsLogo.single('logo'), settingsController.uploadLogo);

export default router;