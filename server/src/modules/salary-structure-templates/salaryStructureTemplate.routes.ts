import { Router } from 'express';
import { salaryStructureTemplateController } from './salaryStructureTemplate.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createSalaryStructureTemplateSchema, updateSalaryStructureTemplateSchema } from './salaryStructureTemplate.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('process-payroll'), salaryStructureTemplateController.list);
router.get('/:id', authorize('process-payroll'), salaryStructureTemplateController.getById);
router.post('/', authorize('manage-payroll-config'), validate(createSalaryStructureTemplateSchema), salaryStructureTemplateController.create);
router.patch('/:id', authorize('manage-payroll-config'), validate(updateSalaryStructureTemplateSchema), salaryStructureTemplateController.update);
router.delete('/:id', authorize('manage-payroll-config'), salaryStructureTemplateController.remove);

export default router;
