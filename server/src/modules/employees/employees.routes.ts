import { Router } from 'express';
import { employeesController } from './employees.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', employeesController.list);
router.get('/:id', employeesController.getById);
router.post('/', validate(createEmployeeSchema), employeesController.create);
router.put('/:id', validate(updateEmployeeSchema), employeesController.update);
router.delete('/:id', employeesController.remove);

export default router;