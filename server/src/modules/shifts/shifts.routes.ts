import { Router } from 'express';
import { shiftsController } from './shifts.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createShiftSchema, updateShiftSchema } from './shifts.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', shiftsController.list);
router.get('/:id', shiftsController.getById);
router.post('/', validate(createShiftSchema), shiftsController.create);
router.patch('/:id', validate(updateShiftSchema), shiftsController.update);
router.delete('/:id', shiftsController.remove);

export default router;