import { Router } from 'express';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import * as complianceController from './compliance.controller.js';
import { complianceRunParamsSchema, auditLogQuerySchema } from './compliance.validation.js';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('view-payroll'), complianceController.getAllComplianceSummary);

router.get('/runs/:runId/check', authorize('view-payroll'), validate(complianceRunParamsSchema, 'params'), complianceController.runComplianceCheck);

router.get('/runs/:runId/summary', authorize('view-payroll'), validate(complianceRunParamsSchema, 'params'), complianceController.getComplianceSummary);

router.get('/runs/:runId/gap-report', authorize('view-payroll'), validate(complianceRunParamsSchema, 'params'), complianceController.getGapReport);

router.get('/audit-log', authorize('view-payroll'), validate(auditLogQuerySchema, 'query'), complianceController.getConfigAuditLog);

export default router;
