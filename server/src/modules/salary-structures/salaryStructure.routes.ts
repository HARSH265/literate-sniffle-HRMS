import { Router } from 'express';
import { salaryStructureController } from './salaryStructure.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createSalaryStructureSchema, updateSalaryStructureSchema } from './salaryStructure.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('process-payroll'), salaryStructureController.list);
router.get('/employee/:employeeId', authorize('process-payroll'), salaryStructureController.getByEmployee);
router.get('/:id', authorize('process-payroll'), salaryStructureController.getById);
router.post('/', authorize('manage-payroll-config'), validate(createSalaryStructureSchema), salaryStructureController.create);
router.patch('/:id', authorize('manage-payroll-config'), validate(updateSalaryStructureSchema), salaryStructureController.update);
router.delete('/:id', authorize('manage-payroll-config'), salaryStructureController.remove);

export default router;
