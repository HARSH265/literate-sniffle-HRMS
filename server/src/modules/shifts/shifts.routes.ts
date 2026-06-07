import { Router } from 'express';
import { shiftsController } from './shifts.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createShiftSchema, updateShiftSchema } from './shifts.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), shiftsController.list);
router.get('/:id', authorize('view-departments'), shiftsController.getById);
router.post('/', authorize('manage-departments'), validate(createShiftSchema), shiftsController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateShiftSchema), shiftsController.update);
router.delete('/:id', authorize('manage-departments'), shiftsController.remove);

export default router;