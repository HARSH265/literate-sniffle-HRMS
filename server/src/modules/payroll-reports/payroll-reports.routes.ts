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

const itemIdParamSchema = z.object({
  itemId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid item ID'),
});

const yearQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
}).passthrough();

router.get('/payslip/:itemId/pdf', authorize('view-payroll'), validate(itemIdParamSchema, 'params'), reportsController.downloadPayslip);
router.get('/bank-file/:runId', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadBankFile);
router.get('/salary-register/:runId/csv', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadSalaryRegisterCsv);
router.get('/salary-register/:runId', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadSalaryRegister);
router.get('/run/:runId/data', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.downloadRunPdf);

router.get('/headcount-cost', authorize('view-payroll'), validate(yearQuerySchema, 'query'), reportsController.getHeadcountCost);
router.get('/mom-variance', authorize('view-payroll'), reportsController.getMoMVariance);
router.get('/ytd-cost', authorize('view-payroll'), validate(yearQuerySchema, 'query'), reportsController.getYtdCost);
router.get('/ot-lop/:runId', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.getOtLop);
router.get('/loan-outstanding', authorize('view-payroll'), reportsController.getLoanOutstanding);
router.get('/budget-vs-actual/:runId', authorize('view-payroll'), validate(runIdParamSchema, 'params'), reportsController.getBudgetVsActualReport);

router.post('/export-table', authorize('view-payroll'), reportsController.exportTable);

export default router;
