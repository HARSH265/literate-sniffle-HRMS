import { Router } from 'express';
import { componentMasterController } from './componentMaster.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createComponentMasterSchema, updateComponentMasterSchema } from './componentMaster.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('process-payroll'), componentMasterController.list);
router.get('/:id', authorize('process-payroll'), componentMasterController.getById);
router.post('/', authorize('manage-payroll-config'), validate(createComponentMasterSchema), componentMasterController.create);
router.patch('/:id', authorize('manage-payroll-config'), validate(updateComponentMasterSchema), componentMasterController.update);
router.delete('/:id', authorize('manage-payroll-config'), componentMasterController.remove);

export default router;
