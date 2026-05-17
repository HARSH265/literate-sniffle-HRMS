import { Router } from 'express';
import { overtimeEntriesController } from './overtimeEntries.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createOvertimeEntrySchema, updateOvertimeEntrySchema } from './overtimeEntries.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-employees'), overtimeEntriesController.list);
router.get('/:id', authorize('view-employees'), overtimeEntriesController.getById);
router.post('/', authorize('manage-overtime'), validate(createOvertimeEntrySchema), overtimeEntriesController.create);
router.patch('/:id', authorize('manage-overtime'), validate(updateOvertimeEntrySchema), overtimeEntriesController.update);
router.delete('/:id', authorize('manage-overtime'), overtimeEntriesController.remove);

export default router;