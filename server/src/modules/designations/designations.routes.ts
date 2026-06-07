import { Router } from 'express';
import { designationsController } from './designations.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDesignationSchema, updateDesignationSchema } from './designations.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), designationsController.list);
router.get('/:id', authorize('view-departments'), designationsController.getById);
router.post('/', authorize('manage-departments'), validate(createDesignationSchema), designationsController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateDesignationSchema), designationsController.update);
router.delete('/:id', authorize('manage-departments'), designationsController.remove);

export default router;