import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/runs', payrollController.listRuns);
router.post('/run', payrollController.runPayroll);
router.post('/run/:id/finalize', payrollController.finalizeRun);
router.get('/run/:id', payrollController.getRunDetails);

export default router;