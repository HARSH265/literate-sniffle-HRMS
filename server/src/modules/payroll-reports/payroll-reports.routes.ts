import { Router } from 'express';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { z } from 'zod';
import * as reportsController from './payroll-reports.controller.js';

const router = Router();

router.use(authenticate);

const runIdParamSchema = z.object({
  runId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid run ID'),
});

// CSV export for Salary Register
router.get('/salary-register/:runId/csv', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadSalaryRegisterCsv);

// PDF export for Payroll Run summary
router.get('/run/:runId/pdf', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadRunPdf);

export default router;