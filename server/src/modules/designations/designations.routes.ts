import { Router } from 'express';
import { designationsController } from './designations.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDesignationSchema, updateDesignationSchema } from './designations.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', designationsController.list);
router.get('/:id', designationsController.getById);
router.post('/', validate(createDesignationSchema), designationsController.create);
router.patch('/:id', validate(updateDesignationSchema), designationsController.update);
router.delete('/:id', designationsController.remove);

export default router;