import { Router } from 'express';
import { departmentsController } from './departments.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/next-code', authorize('manage-departments'), departmentsController.generateNextCode);
router.get('/', authorize('view-departments'), departmentsController.list);
router.get('/:id', authorize('view-departments'), departmentsController.getById);
router.post('/', authorize('manage-departments'), validate(createDepartmentSchema), departmentsController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateDepartmentSchema), departmentsController.update);
router.delete('/:id', authorize('manage-departments'), departmentsController.remove);

export default router;