import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Employee from '../../../models/Employee.model.js';
import Department from '../../../models/Department.model.js';
import AttendanceEntry from '../../../models/AttendanceEntry.model.js';
import PayrollRun from '../../../models/PayrollRun.model.js';
import PayrollItem from '../../../models/PayrollItem.model.js';
import { ReportsService } from '../reports.service.js';

let deptId: string;
let empId: string;
let runId: string;

beforeAll(async () => {
  const dept = await Department.create({ name: 'Engineering', code: 'ENG', isActive: true });
  deptId = dept._id.toString();
  const emp = await Employee.create({
    employeeCode: 'RPT001', fullName: 'Report Emp', fatherName: 'Parent',
    category: 'worker', employmentType: 'permanent',
    department: dept._id, designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(), joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly', baseSalary: 25000, status: 'active',
  });
  empId = emp._id.toString();
});

beforeEach(async () => {
  await AttendanceEntry.deleteMany({});
  await PayrollRun.deleteMany({});
  await PayrollItem.deleteMany({});
  await AttendanceEntry.create({ employee: empId, date: new Date('2025-03-15'), status: 'present', shift: new mongoose.Types.ObjectId(), enteredBy: new mongoose.Types.ObjectId() });
  const run = await PayrollRun.create({ month: '2025-03', status: 'finalized', totalEmployees: 1, totalNetPay: 23000, processedBy: new mongoose.Types.ObjectId(), createdAt: new Date('2025-08-15') });
  runId = run._id.toString();
  await PayrollItem.create({
    payrollRun: run._id, employee: empId, month: '2025-03',
    status: 'finalized', totalDays: 31, presentDays: 22, absentDays: 2,
    halfDays: 0, weeklyOffs: 4, holidays: 1, effectiveWorkingDays: 22,
    basicEarnings: 25000, grossEarnings: 25000, totalDeductions: 2000, netPay: 23000,
  });
});

describe('ReportsService', () => {
  describe('getAttendanceSummary', () => {
    it('returns attendance summary', async () => {
      const result = await ReportsService.getAttendanceSummary({ month: '3', year: '2025', department: deptId }) as any;
      expect(result.stats.totalPresent).toBeGreaterThan(0);
      expect(result.period).toBeTruthy();
    });
  });

  describe('getPayrollSummary', () => {
    it('returns payroll summary', async () => {
      const result = await ReportsService.getPayrollSummary({ year: '2025' }) as any;
      expect(result.monthlyData.length).toBeGreaterThan(0);
      expect(result.ytd.totalNet).toBe(23000);
    });
  });

  describe('getDepartmentWiseSummary', () => {
    it('returns department wise summary', async () => {
      const result = await ReportsService.getDepartmentWiseSummary() as any;
      expect(result.departments.length).toBeGreaterThan(0);
      const eng = result.departments.find((d: any) => d.name === 'Engineering');
      expect(eng).toBeTruthy();
      expect(eng.totalEmployees).toBe(1);
    });
  });

  describe('getChartData', () => {
    it('returns attendance chart data', async () => {
      const result = await ReportsService.getChartData({ chartType: 'attendance' }) as any;
      expect(result.chartType).toBe('attendance');
      expect(result.data).toBeTruthy();
    });

    it('returns department chart data', async () => {
      const result = await ReportsService.getChartData({ chartType: 'department' }) as any;
      expect(result.chartType).toBe('department');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('returns payroll chart data', async () => {
      const result = await ReportsService.getChartData({ chartType: 'payroll' }) as any;
      expect(result.chartType).toBe('payroll');
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('getDrillDown', () => {
    it('returns attendance drill down', async () => {
      const result = await ReportsService.getDrillDown({ entity: 'attendance', id: empId }) as any;
      expect(result.entity).toBe('attendance');
      expect(result.total).toBeGreaterThan(0);
    });

    it('returns payroll drill down', async () => {
      const result = await ReportsService.getDrillDown({ entity: 'payroll', id: runId }) as any;
      expect(result.entity).toBe('payroll');
      expect(result.total).toBeGreaterThan(0);
    });

    it('returns department drill down', async () => {
      const result = await ReportsService.getDrillDown({ entity: 'department' }) as any;
      expect(result.entity).toBe('department');
      expect(result.records.length).toBeGreaterThan(0);
    });
  });

  describe('getScheduledExportConfig', () => {
    it('returns default config', async () => {
      const result = await ReportsService.getScheduledExportConfig() as any;
      expect(result.config).toBeTruthy();
    });
  });
});
