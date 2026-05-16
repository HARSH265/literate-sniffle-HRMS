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

export default router;