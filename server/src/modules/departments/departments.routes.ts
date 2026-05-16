import { Router } from 'express';
import { departmentsController } from './departments.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', departmentsController.list);
router.get('/:id', departmentsController.getById);
router.post('/', validate(createDepartmentSchema), departmentsController.create);
router.patch('/:id', validate(updateDepartmentSchema), departmentsController.update);
router.delete('/:id', departmentsController.remove);

export default router;