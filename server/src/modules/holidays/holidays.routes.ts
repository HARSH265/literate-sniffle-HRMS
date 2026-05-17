import { Router } from 'express';
import { holidaysController } from './holidays.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createHolidaySchema, updateHolidaySchema } from './holidays.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), holidaysController.list);
router.get('/:id', authorize('view-departments'), holidaysController.getById);
router.post('/', authorize('manage-departments'), validate(createHolidaySchema), holidaysController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateHolidaySchema), holidaysController.update);
router.delete('/:id', authorize('manage-departments'), holidaysController.remove);

export default router;