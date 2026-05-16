import { Router } from 'express';
import { holidaysController } from './holidays.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createHolidaySchema, updateHolidaySchema } from './holidays.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', holidaysController.list);
router.get('/:id', holidaysController.getById);
router.post('/', validate(createHolidaySchema), holidaysController.create);
router.patch('/:id', validate(updateHolidaySchema), holidaysController.update);
router.delete('/:id', holidaysController.remove);

export default router;