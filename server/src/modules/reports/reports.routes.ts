import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import {
  exportEmployeesQuery,
  exportAttendanceQuery,
  attendanceSummaryQuery,
  exportPayrollQuery,
  payrollSummaryQuery,
  exportOvertimeQuery,
  overtimeSummaryQuery,
  getChartDataQuery,
  getDrillDownQuery,
  getCustomReportBody,
  saveScheduledExportConfigBody,
} from './reports.validation.js';

const router = Router();

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_ENABLED ? 5 : 100000,
  skip: () => !env.RATE_LIMIT_ENABLED,
  message: { success: false, message: 'Too many export requests, try again later', errors: [] },
});

router.use(authenticate);

router.get('/employees', exportLimiter, authorize('view-reports'), validate(exportEmployeesQuery, 'query'), reportsController.exportEmployees);
router.get('/attendance', exportLimiter, authorize('view-reports'), validate(exportAttendanceQuery, 'query'), reportsController.exportAttendance);
router.get('/attendance/summary', authorize('view-reports'), validate(attendanceSummaryQuery, 'query'), reportsController.getAttendanceSummary);
router.get('/payroll', exportLimiter, authorize('view-reports'), validate(exportPayrollQuery, 'query'), reportsController.exportPayroll);
router.get('/payroll/summary', authorize('view-reports'), validate(payrollSummaryQuery, 'query'), reportsController.getPayrollSummary);
router.get('/departments', authorize('view-reports'), reportsController.getDepartmentSummary);
router.get('/overtime', exportLimiter, authorize('view-reports'), validate(exportOvertimeQuery, 'query'), reportsController.exportOvertime);
router.get('/overtime/summary', authorize('view-reports'), validate(overtimeSummaryQuery, 'query'), reportsController.getOvertimeSummary);

router.post('/custom', authorize('view-reports'), validate(getCustomReportBody), reportsController.getCustomReport);
router.get('/chart-data', authorize('view-reports'), validate(getChartDataQuery, 'query'), reportsController.getChartData);
router.get('/drill-down', authorize('view-reports'), validate(getDrillDownQuery, 'query'), reportsController.getDrillDown);
router.get('/scheduled-export-config', authorize('view-reports'), reportsController.getScheduledExportConfig);
router.patch('/scheduled-export-config', authorize('manage-settings'), validate(saveScheduledExportConfigBody), reportsController.saveScheduledExportConfig);

export default router;