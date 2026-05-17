import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/runs', authorize('process-payroll'), payrollController.listRuns);
router.post('/run', authorize('process-payroll'), payrollController.runPayroll);
router.post('/run/:id/finalize', authorize('process-payroll'), payrollController.finalizeRun);
router.get('/run/:id', authorize('process-payroll'), payrollController.getRunDetails);

export default router;