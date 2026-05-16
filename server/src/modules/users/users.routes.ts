import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createUserSchema, updateUserSchema } from './users.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('manage-users'));

router.get('/', usersController.list);
router.get('/:id', usersController.getById);
router.post('/', validate(createUserSchema), usersController.create);
router.patch('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', usersController.remove);

export default router;