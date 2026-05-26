import { z } from 'zod';

const dateRangeQuery = {
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{1,2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  department: z.string().optional(),
};

export const exportEmployeesQuery = z.object({
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  category: z.enum(['worker', 'office-staff']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const exportAttendanceQuery = z.object(dateRangeQuery).refine(
  (data) => (data.startDate && data.endDate) || (data.month && data.year),
  { message: 'Either month/year or startDate/endDate required' }
);

export const attendanceSummaryQuery = z.object(dateRangeQuery);

export const exportPayrollQuery = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department: z.string().optional(),
});

export const payrollSummaryQuery = z.object({
  year: z.string().regex(/^\d{4}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department: z.string().optional(),
});

export const exportOvertimeQuery = z.object(dateRangeQuery).refine(
  (data) => (data.startDate && data.endDate) || (data.month && data.year),
  { message: 'Either month/year or startDate/endDate required' }
);

export const overtimeSummaryQuery = z.object(dateRangeQuery);

export const getChartDataQuery = z.object({
  chartType: z.enum(['attendance', 'payroll', 'department', 'leave']),
  'period.start': z.string().optional(),
  'period.end': z.string().optional(),
  groupBy: z.enum(['month', 'department', 'category', 'status']).optional(),
});

export const getDrillDownQuery = z.object({
  entity: z.enum(['attendance', 'payroll', 'department', 'leave']),
  id: z.string().optional(),
  'period.start': z.string().optional(),
  'period.end': z.string().optional(),
  filters: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const getCustomReportBody = z.object({
  fields: z.array(z.string()).optional(),
  filters: z.object({
    status: z.enum(['active', 'inactive', 'terminated']).optional(),
    category: z.enum(['worker', 'office-staff']).optional(),
    department: z.string().optional(),
    employmentType: z.enum(['permanent', 'contract', 'temporary', 'trainee']).optional(),
    salaryType: z.enum(['monthly', 'daily']).optional(),
    search: z.string().max(200).optional(),
  }).optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
});

export const saveScheduledExportConfigBody = z.object({
  scheduledExportEnabled: z.boolean().optional(),
  scheduledExportFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  scheduledExportDay: z.number().int().min(1).max(31).optional(),
  scheduledExportFormat: z.enum(['xlsx', 'csv']).optional(),
  scheduledExportRecipients: z.array(z.string().email()).optional(),
  scheduledExportReports: z.array(z.string()).optional(),
});
