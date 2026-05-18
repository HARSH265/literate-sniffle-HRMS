import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/runs', authorize('process-payroll'), payrollController.listRuns);
router.get('/runs/employee/:employeeId', authorize('process-payroll'), payrollController.getByEmployee);
router.post('/run', authorize('process-payroll'), payrollController.runPayroll);
router.get('/run/:id', authorize('process-payroll'), payrollController.getRunDetails);
router.patch('/run/:id/item/:itemId', authorize('process-payroll'), payrollController.updatePayrollItem);
router.post('/run/:id/finalize', authorize('process-payroll'), payrollController.finalizeRun);
router.post('/run/:id/unfinalize', authorize('process-payroll'), payrollController.unfinalizeRun);
router.delete('/run/:id', authorize('process-payroll'), payrollController.deleteRun);

export default router;