import { Router } from 'express';
import { employeesController } from './employees.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-employees'), employeesController.list);
router.get('/:id', authorize('view-employees'), employeesController.getById);
router.post('/', authorize('manage-employees'), validate(createEmployeeSchema), employeesController.create);
router.put('/:id', authorize('manage-employees'), validate(updateEmployeeSchema), employeesController.update);
router.delete('/:id', authorize('manage-employees'), employeesController.remove);

export default router;