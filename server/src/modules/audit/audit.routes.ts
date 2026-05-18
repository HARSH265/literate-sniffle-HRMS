import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { auditListSchema } from './audit.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('view-audit'));

router.get('/', validate(auditListSchema), auditController.list);
router.get('/modules', auditController.getModules);
router.get('/actions', auditController.getActions);
router.get('/export', auditController.exportLogs);
router.get('/stats', auditController.getStats);
router.get('/retention', auditController.getRetentionInfo);
router.post('/cleanup', auditController.deleteOldLogs);

export default router;