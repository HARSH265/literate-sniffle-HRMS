import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  runPayrollSchema, listRunsSchema, updatePayrollItemSchema,
  batchUpdateItemsSchema, finalizeRunSchema, unfinalizeRunSchema,
  payrollIdParamSchema, payrollItemParamSchema, payrollEmployeeParamSchema,
} from './payroll.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/runs', authorize('process-payroll'), validate(listRunsSchema, 'query'), payrollController.listRuns);
router.get('/runs/employee/:employeeId', authorize('process-payroll'), validate(payrollEmployeeParamSchema, 'params'), payrollController.getByEmployee);
router.post('/run', authorize('process-payroll'), validate(runPayrollSchema), payrollController.runPayroll);
router.post('/preview', authorize('process-payroll'), validate(runPayrollSchema), payrollController.previewRun);
router.get('/run/:id', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.getRunDetails);
router.post('/run/:id/submit', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.submitRun);
router.post('/run/:id/approve', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.approveRun);
router.post('/run/:id/reject', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.rejectRun);
router.patch('/run/:id/item/:itemId', authorize('process-payroll'), validate(payrollItemParamSchema, 'params'), validate(updatePayrollItemSchema), payrollController.updatePayrollItem);
router.patch('/run/:id/items/batch', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), validate(batchUpdateItemsSchema), payrollController.batchUpdateItems);
router.post('/run/:id/finalize', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), validate(finalizeRunSchema), payrollController.finalizeRun);
router.post('/run/:id/unfinalize', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), validate(unfinalizeRunSchema), payrollController.unfinalizeRun);
router.delete('/run/:id', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.deleteRun);

export default router;
