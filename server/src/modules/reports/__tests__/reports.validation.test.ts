import { describe, it, expect } from 'vitest';
import {
  exportEmployeesQuery, exportAttendanceQuery, attendanceSummaryQuery,
  exportPayrollQuery, payrollSummaryQuery, exportOvertimeQuery,
  overtimeSummaryQuery, getChartDataQuery, getDrillDownQuery,
  getCustomReportBody, saveScheduledExportConfigBody,
} from '../reports.validation.js';

describe('reports validation schemas', () => {
  describe('exportEmployeesQuery', () => {
    it('accepts empty input', () => {
      const result = exportEmployeesQuery.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts valid filters', () => {
      const result = exportEmployeesQuery.safeParse({ status: 'active', category: 'worker', department: 'dept1' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = exportEmployeesQuery.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });
  });

  describe('exportAttendanceQuery', () => {
    it('accepts month and year', () => {
      const result = exportAttendanceQuery.safeParse({ month: '3', year: '2025' });
      expect(result.success).toBe(true);
    });

    it('accepts date range', () => {
      const result = exportAttendanceQuery.safeParse({ startDate: '2025-03-01', endDate: '2025-03-31' });
      expect(result.success).toBe(true);
    });

    it('rejects missing both date range and month/year', () => {
      const result = exportAttendanceQuery.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('attendanceSummaryQuery', () => {
    it('accepts empty input', () => {
      const result = attendanceSummaryQuery.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('exportPayrollQuery', () => {
    it('accepts month param', () => {
      const result = exportPayrollQuery.safeParse({ month: '2025-03' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid month format', () => {
      const result = exportPayrollQuery.safeParse({ month: '2025-3' });
      expect(result.success).toBe(false);
    });
  });

  describe('payrollSummaryQuery', () => {
    it('accepts year param', () => {
      const result = payrollSummaryQuery.safeParse({ year: '2025' });
      expect(result.success).toBe(true);
    });
  });

  describe('exportOvertimeQuery', () => {
    it('accepts month and year', () => {
      const result = exportOvertimeQuery.safeParse({ month: '3', year: '2025' });
      expect(result.success).toBe(true);
    });

    it('rejects empty input (needs date range or month/year)', () => {
      const result = exportOvertimeQuery.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('overtimeSummaryQuery', () => {
    it('accepts empty input', () => {
      const result = overtimeSummaryQuery.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('getChartDataQuery', () => {
    it('accepts valid chart type', () => {
      const result = getChartDataQuery.safeParse({ chartType: 'attendance' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid chart type', () => {
      const result = getChartDataQuery.safeParse({ chartType: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('getDrillDownQuery', () => {
    it('accepts valid entity', () => {
      const result = getDrillDownQuery.safeParse({ entity: 'attendance' });
      expect(result.success).toBe(true);
    });
  });

  describe('getCustomReportBody', () => {
    it('accepts empty body', () => {
      const result = getCustomReportBody.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('saveScheduledExportConfigBody', () => {
    it('accepts partial config', () => {
      const result = saveScheduledExportConfigBody.safeParse({ scheduledExportEnabled: true });
      expect(result.success).toBe(true);
    });

    it('rejects invalid frequency', () => {
      const result = saveScheduledExportConfigBody.safeParse({ scheduledExportFrequency: 'yearly' });
      expect(result.success).toBe(false);
    });
  });
});
