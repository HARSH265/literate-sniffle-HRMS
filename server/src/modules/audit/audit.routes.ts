import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { auditListSchema } from './audit.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-audit'), validate(auditListSchema), auditController.list);
router.get('/modules', authorize('view-audit'), auditController.getModules);
router.get('/actions', authorize('view-audit'), auditController.getActions);
router.get('/export', authorize('view-audit'), validate(auditListSchema), auditController.exportLogs);
router.get('/stats', authorize('view-audit'), auditController.getStats);
router.get('/retention', authorize('view-audit'), auditController.getRetentionInfo);
router.post('/cleanup', authorize('manage-audit'), validate(auditListSchema), auditController.deleteOldLogs);

export default router;