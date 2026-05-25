import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/employees', authorize('view-reports'), reportsController.exportEmployees);
router.get('/attendance', authorize('view-reports'), reportsController.exportAttendance);
router.get('/attendance/summary', authorize('view-reports'), reportsController.getAttendanceSummary);
router.get('/payroll', authorize('view-reports'), reportsController.exportPayroll);
router.get('/payroll/summary', authorize('view-reports'), reportsController.getPayrollSummary);
router.get('/departments', authorize('view-reports'), reportsController.getDepartmentSummary);
router.get('/overtime', authorize('view-reports'), reportsController.exportOvertime);
router.get('/overtime/summary', authorize('view-reports'), reportsController.getOvertimeSummary);

router.post('/custom', authorize('view-reports'), reportsController.getCustomReport);
router.get('/chart-data', authorize('view-reports'), reportsController.getChartData);
router.get('/drill-down', authorize('view-reports'), reportsController.getDrillDown);
router.get('/scheduled-export-config', authorize('view-reports'), reportsController.getScheduledExportConfig);
router.patch('/scheduled-export-config', authorize('manage-settings'), reportsController.saveScheduledExportConfig);

export default router;