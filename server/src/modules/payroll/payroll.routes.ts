import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { payrollController } from './payroll.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  runPayrollSchema, listRunsSchema, updatePayrollItemSchema,
  batchUpdateItemsSchema, finalizeRunSchema, unfinalizeRunSchema,
  payrollIdParamSchema, payrollItemParamSchema, payrollEmployeeParamSchema,
} from './payroll.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import Employee from '../../models/Employee.model.js';

const router = Router();

const payrollRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many payroll requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const runPayrollRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 payroll runs per hour
  message: 'Too many payroll run attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const mutatingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 mutating requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(payrollRateLimit);

router.get('/runs', authorize('process-payroll'), validate(listRunsSchema, 'query'), payrollController.listRuns);
router.get('/runs/employee/:employeeId', authorize('process-payroll'), authorizeOwnership({ model: Employee, ownerField: '_id' }), validate(payrollEmployeeParamSchema, 'params'), payrollController.getByEmployee);
router.post('/run', authorize('process-payroll'), runPayrollRateLimit, mutatingRateLimit, validate(runPayrollSchema), payrollController.runPayroll);

router.post('/preview', authorize('process-payroll'), runPayrollRateLimit, validate(runPayrollSchema), payrollController.previewRun);
router.get('/run/:id', authorize('process-payroll'), validate(payrollIdParamSchema, 'params'), payrollController.getRunDetails);
router.post('/run/:id/submit', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), payrollController.submitRun);
router.post('/run/:id/approve', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), payrollController.approveRun);
router.post('/run/:id/reject', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), payrollController.rejectRun);
router.patch('/run/:id/item/:itemId', authorize('process-payroll'), mutatingRateLimit, validate(payrollItemParamSchema, 'params'), validate(updatePayrollItemSchema), payrollController.updatePayrollItem);
router.patch('/run/:id/items/batch', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), validate(batchUpdateItemsSchema), payrollController.batchUpdateItems);
router.post('/run/:id/finalize', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), validate(finalizeRunSchema), payrollController.finalizeRun);
router.post('/run/:id/unfinalize', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), validate(unfinalizeRunSchema), payrollController.unfinalizeRun);
router.delete('/run/:id', authorize('process-payroll'), mutatingRateLimit, validate(payrollIdParamSchema, 'params'), payrollController.deleteRun);

export default router;
