import { Router } from 'express';
import { overtimeEntriesController } from './overtimeEntries.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createOvertimeEntrySchema, updateOvertimeEntrySchema } from './overtimeEntries.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', overtimeEntriesController.list);
router.get('/:id', overtimeEntriesController.getById);
router.post('/', validate(createOvertimeEntrySchema), overtimeEntriesController.create);
router.patch('/:id', validate(updateOvertimeEntrySchema), overtimeEntriesController.update);
router.delete('/:id', overtimeEntriesController.remove);

export default router;