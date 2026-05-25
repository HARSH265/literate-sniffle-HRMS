import Employee from '../../models/Employee.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import OvertimeRule from '../../models/OvertimeRule.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import Department from '../../models/Department.model.js';
import LeaveApplication from '../../models/LeaveApplication.model.js';
import { ExcelGeneratorService } from '../../core/excel/ExcelGeneratorService.js';
import { Response } from 'express';

export class ReportsService {
  static async exportEmployees(filters: Record<string, unknown>, res: Response): Promise<void> {
    const filter: Record<string, unknown> = {};
    
    if (filters.status) filter.status = filters.status;
    if (filters.category) filter.category = filters.category;
    if (filters.department) filter.department = filters.department;
    if (filters.designation) filter.designation = filters.designation;

    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .populate('designation', 'name')
      .populate('shift', 'name')
      .lean();

    const data = employees.map((emp: any) => ({
      'Employee Code': emp.employeeCode,
      'Full Name': emp.fullName,
      "Father's Name": emp.fatherName,
      Category: emp.category === 'worker' ? 'Manufacturing Worker' : 'Office Staff',
      'Employment Type': emp.employmentType,
      Department: emp.department?.name || 'N/A',
      'Department Code': emp.department?.code || 'N/A',
      Designation: emp.designation?.name || 'N/A',
      Shift: emp.shift?.name || 'N/A',
      'Joining Date': emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A',
      'Salary Type': emp.salaryType === 'monthly' ? 'Monthly' : 'Daily',
      'Base Salary': emp.baseSalary || emp.dailyWage || 0,
      Status: emp.status === 'active' ? 'Active' : emp.status === 'inactive' ? 'Inactive' : 'Terminated',
      'Contact Number': emp.contactNumber || 'N/A',
      Address: emp.address || 'N/A',
    }));

    await ExcelGeneratorService.generate(
      res,
      `Employees_Export_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Employees',
      [
        { header: 'Employee Code', key: 'Employee Code', width: 15 },
        { header: 'Full Name', key: 'Full Name', width: 20 },
        { header: "Father's Name", key: "Father's Name", width: 20 },
        { header: 'Category', key: 'Category', width: 18 },
        { header: 'Employment Type', key: 'Employment Type', width: 15 },
        { header: 'Department', key: 'Department', width: 15 },
        { header: 'Dept Code', key: 'Department Code', width: 10 },
        { header: 'Designation', key: 'Designation', width: 15 },
        { header: 'Shift', key: 'Shift', width: 12 },
        { header: 'Joining Date', key: 'Joining Date', width: 12 },
        { header: 'Salary Type', key: 'Salary Type', width: 12 },
        { header: 'Base Salary', key: 'Base Salary', width: 12 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'Contact Number', key: 'Contact Number', width: 15 },
        { header: 'Address', key: 'Address', width: 25 },
      ],
      data,
    );
  }

  static async exportAttendance(filters: Record<string, unknown>, res: Response): Promise<void> {
    const { month, year, department, startDate, endDate } = filters;
    
    let start: Date, end: Date;
    
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (month && year) {
      start = new Date(Number(year), Number(month) - 1, 1);
      end = new Date(Number(year), Number(month), 0);
    } else {
      throw new Error('Either month/year or startDate/endDate required');
    }

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.payrollConfig as any) || {};
    const paidWeeklyOff = config.paidWeeklyOff !== false;
    const paidHolidays = config.paidHolidays !== false;

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .lean();

    const empIds = employees.map((e: any) => e._id);

    const attendances = await AttendanceEntry.find({
      employee: { $in: empIds },
      date: { $gte: start, $lte: end },
    })
      .populate('employee', 'fullName employeeCode')
      .lean();

    const empMap: Record<string, any> = {};
    employees.forEach((emp: any) => {
      empMap[String(emp._id)] = emp;
    });

    const summary: Record<string, any> = {};
    const reportTitle = startDate && endDate 
      ? `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`
      : new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    attendances.forEach((att: any) => {
      const empId = String(att.employee._id);
      if (!summary[empId]) {
        const emp = empMap[empId];
        summary[empId] = {
          'Employee Code': att.employee.employeeCode,
          'Employee Name': att.employee.fullName,
          'Department': emp?.department?.name || 'N/A',
          'Present': 0,
          'Absent': 0,
          'Half Day': 0,
          'Leave': 0,
          'Weekly Off': 0,
          'Holiday': 0,
          'Paid WO': 0,
          'Paid Holiday': 0,
          'Total Days': Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          'Working Days': 0,
        };
      }
      
      switch (att.status) {
        case 'present': summary[empId]['Present']++; break;
        case 'absent': summary[empId]['Absent']++; break;
        case 'half-day': summary[empId]['Half Day']++; break;
        case 'leave': summary[empId]['Leave']++; break;
        case 'weekly-off': 
          summary[empId]['Weekly Off']++;
          if (paidWeeklyOff) summary[empId]['Paid WO']++;
          break;
        case 'holiday': 
          summary[empId]['Holiday']++;
          if (paidHolidays) summary[empId]['Paid Holiday']++;
          break;
      }
    });

    Object.values(summary).forEach((emp: any) => {
      emp['Working Days'] = emp['Present'] + (emp['Half Day'] * 0.5) + emp['Paid WO'] + emp['Paid Holiday'];
    });

    const data = Object.values(summary);

    await ExcelGeneratorService.generate(
      res,
      `Attendance_Report_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
      'Attendance',
      [
        { header: 'Employee Code', key: 'Employee Code', width: 15 },
        { header: 'Employee Name', key: 'Employee Name', width: 20 },
        { header: 'Department', key: 'Department', width: 15 },
        { header: 'Present', key: 'Present', width: 10 },
        { header: 'Absent', key: 'Absent', width: 10 },
        { header: 'Half Day', key: 'Half Day', width: 10 },
        { header: 'Leave', key: 'Leave', width: 10 },
        { header: 'Weekly Off', key: 'Weekly Off', width: 12 },
        { header: 'Holiday', key: 'Holiday', width: 10 },
        { header: 'Paid WO', key: 'Paid WO', width: 10 },
        { header: 'Paid Hol', key: 'Paid Holiday', width: 10 },
        { header: 'Working Days', key: 'Working Days', width: 12 },
        { header: 'Total Days', key: 'Total Days', width: 12 },
      ],
      data,
    );
  }

  static async exportPayroll(filters: Record<string, unknown>, res: Response): Promise<void> {
    const { month, startDate, endDate, department } = filters;
    
    let runs: any[] = [];

    if (month) {
      const run = await PayrollRun.findOne({ month: String(month) }).lean();
      if (run) runs = [run];
    } else if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      runs = await PayrollRun.find({
        createdAt: { $gte: start, $lte: end },
      }).lean();
    } else {
      runs = await PayrollRun.find({ status: 'finalized' }).sort({ createdAt: -1 }).limit(12).lean();
    }

    if (runs.length === 0) {
      throw new Error('No payroll runs found');
    }

    const data: any[] = [];
    for (const run of runs) {
      const query: any = { payrollRun: run._id };
      if (department) {
        const employees = await Employee.find({ department }).select('_id').lean();
        query.employee = { $in: employees.map((e: any) => e._id) };
      }

      const items = await PayrollItem.find(query).lean();
      
      const totalGross = items.reduce((sum: number, i: any) => sum + (i.grossEarnings || 0), 0);
      const totalDeductions = items.reduce((sum: number, i: any) => sum + (i.totalDeductions || 0), 0);
      const totalNet = items.reduce((sum: number, i: any) => sum + (i.netPay || 0), 0);

      const monthName = new Date(run.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

      data.push({
        'Payroll Month': monthName,
        'Status': run.status === 'finalized' ? 'Finalized' : 'Draft',
        'Total Employees': items.length,
        'Total Gross': totalGross,
        'Total Deductions': totalDeductions,
        'Total Net Pay': totalNet,
        'Processed Date': new Date(run.createdAt).toLocaleDateString(),
      });
    }

    await ExcelGeneratorService.generate(
      res,
      `Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Payroll',
      [
        { header: 'Payroll Month', key: 'Payroll Month', width: 20 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'Employees', key: 'Total Employees', width: 12 },
        { header: 'Total Gross', key: 'Total Gross', width: 15 },
        { header: 'Total Deductions', key: 'Total Deductions', width: 15 },
        { header: 'Total Net Pay', key: 'Total Net Pay', width: 15 },
        { header: 'Processed Date', key: 'Processed Date', width: 15 },
      ],
      data,
    );
  }

  static async getAttendanceSummary(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { month, year, startDate, endDate, department } = filters;
    
    let start: Date, end: Date;
    
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (month && year) {
      start = new Date(Number(year), Number(month) - 1, 1);
      end = new Date(Number(year), Number(month), 0);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.payrollConfig as any) || {};

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .lean();

    const empIds = employees.map((e: any) => e._id);

    const attendances = await AttendanceEntry.find({
      employee: { $in: empIds },
      date: { $gte: start, $lte: end },
    }).lean();

    const stats = {
      totalEmployees: employees.length,
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      totalWeeklyOff: 0,
      totalHoliday: 0,
      byDepartment: {} as Record<string, any>,
    };

    employees.forEach((emp: any) => {
      const deptName = emp.department?.name || 'Unassigned';
      if (!stats.byDepartment[deptName]) {
        stats.byDepartment[deptName] = {
          employees: 0,
          present: 0,
          absent: 0,
          halfDay: 0,
          leave: 0,
          weeklyOff: 0,
          holiday: 0,
        };
      }
      stats.byDepartment[deptName].employees++;
    });

    attendances.forEach((att: any) => {
      const emp = employees.find((e: any) => String(e._id) === String(att.employee));
      const deptName = (emp as any)?.department?.name || 'Unassigned';

      switch (att.status) {
        case 'present': 
          stats.totalPresent++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].present++;
          break;
        case 'absent': 
          stats.totalAbsent++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].absent++;
          break;
        case 'half-day': 
          stats.totalHalfDay++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].halfDay++;
          break;
        case 'leave': 
          stats.totalLeave++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].leave++;
          break;
        case 'weekly-off': 
          stats.totalWeeklyOff++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].weeklyOff++;
          break;
        case 'holiday': 
          stats.totalHoliday++; 
          if (stats.byDepartment[deptName]) stats.byDepartment[deptName].holiday++;
          break;
      }
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      stats,
      config,
    };
  }

  static async getPayrollSummary(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { year, startDate, endDate, department } = filters;

    let runs: any[] = [];

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      runs = await PayrollRun.find({
        status: 'finalized',
        createdAt: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 }).lean();
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31);
      runs = await PayrollRun.find({
        status: 'finalized',
        createdAt: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 }).lean();
    } else {
      runs = await PayrollRun.find({ status: 'finalized' })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();
    }

    const monthlyData: any[] = [];
    let ytdTotalNet = 0;
    let ytdTotalGross = 0;
    let ytdTotalDeductions = 0;

    for (const run of runs) {
      const query: any = { payrollRun: run._id };
      if (department) {
        const employees = await Employee.find({ department }).select('_id').lean();
        query.employee = { $in: employees.map((e: any) => e._id) };
      }

      const items = await PayrollItem.find(query).lean();
      
      const totalGross = items.reduce((sum: number, i: any) => sum + (i.grossEarnings || 0), 0);
      const totalDeductions = items.reduce((sum: number, i: any) => sum + (i.totalDeductions || 0), 0);
      const totalNet = items.reduce((sum: number, i: any) => sum + (i.netPay || 0), 0);

      ytdTotalGross += totalGross;
      ytdTotalDeductions += totalDeductions;
      ytdTotalNet += totalNet;

      monthlyData.push({
        month: run.month,
        employees: items.length,
        gross: totalGross,
        deductions: totalDeductions,
        net: totalNet,
      });
    }

    return {
      monthlyData,
      ytd: {
        totalGross: ytdTotalGross,
        totalDeductions: ytdTotalDeductions,
        totalNet: ytdTotalNet,
        months: monthlyData.length,
      },
    };
  }

  static async getDepartmentWiseSummary(): Promise<Record<string, unknown>> {
    const employees = await Employee.find({ status: 'active' })
      .populate('department', 'name')
      .lean();

    const deptStats: Record<string, any> = {};

    employees.forEach((emp: any) => {
      const deptName = emp.department?.name || 'Unassigned';
      if (!deptStats[deptName]) {
        deptStats[deptName] = {
          totalEmployees: 0,
          workers: 0,
          officeStaff: 0,
          permanent: 0,
          contract: 0,
          temporary: 0,
          trainee: 0,
          monthlySalary: 0,
          dailyWage: 0,
        };
      }
      deptStats[deptName].totalEmployees++;
      if (emp.category === 'worker') deptStats[deptName].workers++;
      else deptStats[deptName].officeStaff++;

      const empType = emp.employmentType || 'permanent';
      if (deptStats[deptName][empType] !== undefined) {
        deptStats[deptName][empType]++;
      }

      if (emp.salaryType === 'monthly') deptStats[deptName].monthlySalary++;
      else deptStats[deptName].dailyWage++;
    });

    return { departments: Object.entries(deptStats).map(([name, stats]) => ({ name, ...stats as any })) };
  }

  static async exportOvertime(filters: Record<string, unknown>, res: Response): Promise<void> {
    const { month, year, department, startDate, endDate } = filters;
    
    let start: Date, end: Date;
    
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (month && year) {
      start = new Date(Number(year), Number(month) - 1, 1);
      end = new Date(Number(year), Number(month), 0);
    } else {
      throw new Error('Either month/year or startDate/endDate required');
    }

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .lean();

    const empIds = employees.map((e: any) => e._id);

    const overtimes = await OvertimeEntry.find({
      employee: { $in: empIds },
      date: { $gte: start, $lte: end },
    })
      .populate('employee', 'fullName employeeCode')
      .populate('overtimeRule', 'name multiplier')
      .lean();

    const empMap: Record<string, any> = {};
    employees.forEach((emp: any) => {
      empMap[String(emp._id)] = emp;
    });

    const data = overtimes.map((ot: any) => ({
      'Employee Code': ot.employee?.employeeCode || 'N/A',
      'Employee Name': ot.employee?.fullName || 'N/A',
      'Department': empMap[String(ot.employee?._id)]?.department?.name || 'N/A',
      'Date': new Date(ot.date).toLocaleDateString(),
      'Hours': ot.hours || 0,
      'Overtime Rule': ot.overtimeRule?.name || 'N/A',
      'Multiplier': ot.overtimeRule?.multiplier ? `${ot.overtimeRule.multiplier}x` : 'N/A',
      'Remarks': ot.remarks || '',
    }));

    const reportTitle = month && year
      ? new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      : `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;

    await ExcelGeneratorService.generate(
      res,
      `Overtime_Report_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
      'Overtime',
      [
        { header: 'Employee Code', key: 'Employee Code', width: 15 },
        { header: 'Employee Name', key: 'Employee Name', width: 20 },
        { header: 'Department', key: 'Department', width: 15 },
        { header: 'Date', key: 'Date', width: 12 },
        { header: 'Hours', key: 'Hours', width: 10 },
        { header: 'Overtime Rule', key: 'Overtime Rule', width: 18 },
        { header: 'Multiplier', key: 'Multiplier', width: 12 },
        { header: 'Remarks', key: 'Remarks', width: 20 },
      ],
      data,
    );
  }

  static async getOvertimeSummary(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { month, year, startDate, endDate, department } = filters;
    
    let start: Date, end: Date;
    
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (month && year) {
      start = new Date(Number(year), Number(month) - 1, 1);
      end = new Date(Number(year), Number(month), 0);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const rules = await OvertimeRule.find({ isActive: true }).lean();
    const rulesMap: Record<string, any> = {};
    rules.forEach((r: any) => { rulesMap[String(r._id)] = r; });

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .lean();

    const empIds = employees.map((e: any) => e._id);

    const overtimes = await OvertimeEntry.find({
      employee: { $in: empIds },
      date: { $gte: start, $lte: end },
    }).lean();

    const stats = {
      totalEmployeesWithOT: 0,
      totalOvertimeHours: 0,
      totalEntries: overtimes.length,
      byEmployee: {} as Record<string, any>,
      byDepartment: {} as Record<string, any>,
      ruleUsage: {} as Record<string, number>,
    };

    overtimes.forEach((ot: any) => {
      const empId = String(ot.employee);
      const emp = employees.find((e: any) => String(e._id) === empId);
      const deptName = (emp as any)?.department?.name || 'Unassigned';

      stats.totalOvertimeHours += ot.hours || 0;

      if (!stats.byEmployee[empId]) {
        stats.byEmployee[empId] = {
          name: (emp as any)?.fullName || 'Unknown',
          code: (emp as any)?.employeeCode || 'N/A',
          totalHours: 0,
          entries: 0,
          department: deptName,
        };
      }
      stats.byEmployee[empId].totalHours += ot.hours || 0;
      stats.byEmployee[empId].entries++;

      if (!stats.byDepartment[deptName]) {
        stats.byDepartment[deptName] = { totalHours: 0, employees: 0 };
      }
      stats.byDepartment[deptName].totalHours += ot.hours || 0;

      if (ot.overtimeRule) {
        const ruleName = rulesMap[String(ot.overtimeRule)]?.name || 'Unknown';
        stats.ruleUsage[ruleName] = (stats.ruleUsage[ruleName] || 0) + (ot.hours || 0);
      }
    });

    stats.totalEmployeesWithOT = Object.keys(stats.byEmployee).length;

    Object.values(stats.byDepartment).forEach((dept: any) => {
      const deptEmployees = employees.filter((e: any) => (e as any)?.department?.name === Object.keys(stats.byDepartment).find(
        d => stats.byDepartment[d] === dept
      ));
      if (deptEmployees.length > 0) {
        const deptName = Object.keys(stats.byDepartment).find(d => stats.byDepartment[d] === dept);
        const deptEmps = employees.filter((e: any) => (e as any)?.department?.name === deptName);
        dept.employees = deptEmps.length;
      }
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      stats,
      rules: rules.map((r: any) => ({ id: String(r._id), name: r.name, multiplier: r.multiplier, maxHoursPerDay: r.maxHoursPerDay, maxHoursPerMonth: r.maxHoursPerMonth })),
    };
  }

  static async getCustomReport(params: {
    fields: string[];
    filters: Record<string, any>;
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const { fields, filters, groupBy, sortBy, sortOrder, limit } = params;

    const availableFields: Record<string, string> = {
      employeeCode: 'employeeCode',
      fullName: 'fullName',
      fatherName: 'fatherName',
      category: 'category',
      employmentType: 'employmentType',
      salaryType: 'salaryType',
      baseSalary: 'baseSalary',
      dailyWage: 'dailyWage',
      status: 'status',
      department: 'department.name',
      designation: 'designation.name',
      shift: 'shift.name',
      joiningDate: 'joiningDate',
      contactNumber: 'contactNumber',
    };

    const selectedFields = fields?.length > 0
      ? fields.filter((f) => availableFields[f])
      : Object.keys(availableFields);

    const query: Record<string, any> = {};
    if (filters) {
      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      if (filters.department) query.department = filters.department;
      if (filters.employmentType) query.employmentType = filters.employmentType;
      if (filters.salaryType) query.salaryType = filters.salaryType;
      if (filters.search) {
        query.$or = [
          { fullName: { $regex: filters.search, $options: 'i' } },
          { employeeCode: { $regex: filters.search, $options: 'i' } },
        ];
      }
    }

    let employees = await Employee.find(query)
      .populate('department', 'name code')
      .populate('designation', 'name')
      .populate('shift', 'name')
      .lean();

    let data = employees.map((emp: any) => {
      const row: Record<string, any> = {};
      selectedFields.forEach((field) => {
        if (field === 'department') row['department'] = emp.department?.name || 'N/A';
        else if (field === 'designation') row['designation'] = emp.designation?.name || 'N/A';
        else if (field === 'shift') row['shift'] = emp.shift?.name || 'N/A';
        else row[field] = emp[field] ?? 'N/A';
      });
      return row;
    });

    if (groupBy && availableFields[groupBy]) {
      const grouped: Record<string, any[]> = {};
      data.forEach((row) => {
        const key = String(row[groupBy] || 'Unknown');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      });
      data = Object.entries(grouped).map(([key, items]) => ({
        group: key,
        count: items.length,
        items: items.slice(0, 100),
      }));
    }

    if (sortBy && data.length > 0 && data[0][sortBy] !== undefined) {
      data.sort((a: any, b: any) => {
        const aVal = a[sortBy] ?? '';
        const bVal = b[sortBy] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    if (limit && !groupBy) {
      data = data.slice(0, limit);
    }

    return {
      fields: selectedFields,
      total: employees.length,
      data,
      groupBy: groupBy || null,
    };
  }

  static async getChartData(params: {
    chartType: 'attendance' | 'payroll' | 'department' | 'leave';
    period?: { start?: string; end?: string };
    groupBy?: 'month' | 'department' | 'category' | 'status';
  }): Promise<Record<string, unknown>> {
    const { chartType, period, groupBy } = params;

    let start: Date, end: Date;
    if (period?.start && period?.end) {
      start = new Date(period.start);
      end = new Date(period.end);
    } else {
      end = new Date();
      start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    }

    if (chartType === 'attendance') {
      const employeeFilter: Record<string, unknown> = { status: 'active' };
      const employees = await Employee.find(employeeFilter)
        .populate('department', 'name')
        .lean();

      const attendances = await AttendanceEntry.find({
        employee: { $in: employees.map((e: any) => e._id) },
        date: { $gte: start, $lte: end },
      }).lean();

      if (groupBy === 'month') {
        const byMonth: Record<string, any> = {};
        attendances.forEach((att: any) => {
          const d = new Date(att.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!byMonth[key]) byMonth[key] = { month: key, present: 0, absent: 0, halfDay: 0, leave: 0 };
          const status = att.status === 'half-day' ? 'halfDay' : att.status;
          if (byMonth[key][status] !== undefined) byMonth[key][status]++;
        });
        return { chartType, groupBy: 'month', data: Object.values(byMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)) };
      }

      if (groupBy === 'department') {
        const byDept: Record<string, any> = {};
        attendances.forEach((att: any) => {
          const emp = employees.find((e: any) => String(e._id) === String(att.employee));
          const deptName = (emp as any)?.department?.name || 'Unassigned';
          if (!byDept[deptName]) byDept[deptName] = { department: deptName, present: 0, absent: 0, halfDay: 0 };
          const status = att.status === 'half-day' ? 'halfDay' : att.status;
          if (byDept[deptName][status] !== undefined) byDept[deptName][status]++;
        });
        return { chartType, groupBy: 'department', data: Object.values(byDept) };
      }

      const totalPresent = attendances.filter((a: any) => a.status === 'present').length;
      const totalAbsent = attendances.filter((a: any) => a.status === 'absent').length;
      const totalHalfDay = attendances.filter((a: any) => a.status === 'half-day').length;
      const totalLeave = attendances.filter((a: any) => a.status === 'leave').length;

      return {
        chartType,
        data: [
          { name: 'Present', value: totalPresent, color: '#3f8600' },
          { name: 'Absent', value: totalAbsent, color: '#cf1322' },
          { name: 'Half Day', value: totalHalfDay, color: '#faad14' },
          { name: 'Leave', value: totalLeave, color: '#1890ff' },
        ],
      };
    }

    if (chartType === 'payroll') {
      const runs = await PayrollRun.find({
        status: 'finalized',
        createdAt: { $gte: start, $lte: end },
      }).sort({ createdAt: 1 }).lean();

      const data: any[] = [];
      for (const run of runs) {
        const items = await PayrollItem.find({ payrollRun: run._id }).lean();
        const gross = items.reduce((s: number, i: any) => s + (i.grossEarnings || 0), 0);
        const deductions = items.reduce((s: number, i: any) => s + (i.totalDeductions || 0), 0);
        const net = items.reduce((s: number, i: any) => s + (i.netPay || 0), 0);
        data.push({ month: run.month, gross, deductions, net, employees: items.length });
      }

      if (groupBy === 'department') {
        const byDept: Record<string, any> = {};
        for (const run of runs) {
          const items = await PayrollItem.find({ payrollRun: run._id }).populate('employee', 'department').lean();
          items.forEach((item: any) => {
            const dept = (item.employee as any)?.department || 'Unassigned';
            const deptName = typeof dept === 'object' ? (dept as any)?.name || 'Unknown' : 'Unknown';
            if (!byDept[deptName]) byDept[deptName] = { department: deptName, gross: 0, deductions: 0, net: 0, employees: new Set() };
            byDept[deptName].gross += item.grossEarnings || 0;
            byDept[deptName].deductions += item.totalDeductions || 0;
            byDept[deptName].net += item.netPay || 0;
            byDept[deptName].employees.add(String(item.employee));
          });
        }
        return {
          chartType,
          groupBy: 'department',
          data: Object.values(byDept).map((d: any) => ({ ...d, employees: d.employees.size })),
        };
      }

      return { chartType, groupBy: 'month', data };
    }

    if (chartType === 'department') {
      const employees = await Employee.find({ status: 'active' })
        .populate('department', 'name')
        .lean();

      const byDept: Record<string, any> = {};
      employees.forEach((emp: any) => {
        const deptName = emp.department?.name || 'Unassigned';
        if (!byDept[deptName]) byDept[deptName] = { department: deptName, total: 0, workers: 0, officeStaff: 0, monthly: 0, daily: 0 };
        byDept[deptName].total++;
        if (emp.category === 'worker') byDept[deptName].workers++;
        else byDept[deptName].officeStaff++;
        if (emp.salaryType === 'monthly') byDept[deptName].monthly++;
        else byDept[deptName].daily++;
      });

      return { chartType, groupBy: 'department', data: Object.values(byDept) };
    }

    if (chartType === 'leave') {
      const leaves = await LeaveApplication.find({
        createdAt: { $gte: start, $lte: end },
      }).populate('leaveType', 'name').lean();

      const byType: Record<string, number> = {};
      leaves.forEach((l: any) => {
        const typeName = l.leaveType?.name || 'Unknown';
        byType[typeName] = (byType[typeName] || 0) + (l.totalDays || 1);
      });

      const byStatus = { applied: 0, approved: 0, rejected: 0, cancelled: 0 };
      leaves.forEach((l: any) => {
        if (byStatus[l.status as keyof typeof byStatus] !== undefined) byStatus[l.status as keyof typeof byStatus]++;
      });

      return {
        chartType,
        byType: Object.entries(byType).map(([name, days]) => ({ name, days })),
        byStatus: Object.entries(byStatus).map(([name, count]) => ({ name, count })),
        data: leaves,
      };
    }

    return { chartType, data: [] };
  }

  static async getDrillDown(params: {
    entity: 'attendance' | 'payroll' | 'department' | 'leave';
    id?: string;
    period?: { start?: string; end?: string };
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const { entity, id, period, filters, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    if (entity === 'attendance') {
      let query: Record<string, any> = {};
      if (id) query.employee = id;
      if (filters?.status) query.status = filters.status;
      if (period?.start && period?.end) {
        query.date = { $gte: new Date(period.start), $lte: new Date(period.end) };
      }
      if (filters?.department) {
        const empIds = await Employee.find({ department: filters.department }).select('_id').lean();
        query.employee = { $in: empIds.map((e: any) => e._id) };
      }

      const [records, total] = await Promise.all([
        AttendanceEntry.find(query)
          .populate('employee', 'fullName employeeCode')
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AttendanceEntry.countDocuments(query),
      ]);

      return { entity, total, page, limit, totalPages: Math.ceil(total / limit), records };
    }

    if (entity === 'payroll') {
      let query: Record<string, any> = {};
      if (id) query.payrollRun = id;
      if (filters?.department) {
        const empIds = await Employee.find({ department: filters.department }).select('_id').lean();
        query.employee = { $in: empIds.map((e: any) => e._id) };
      }

      const [records, total] = await Promise.all([
        PayrollItem.find(query)
          .populate('employee', 'fullName employeeCode department')
          .sort({ netPay: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PayrollItem.countDocuments(query),
      ]);

      return { entity, total, page, limit, totalPages: Math.ceil(total / limit), records };
    }

    if (entity === 'department') {
      const depts = await Department.find().lean();

      const employees = await Employee.find({ status: 'active' })
        .populate('department', 'name')
        .lean();

      const byDept: Record<string, any> = {};
      employees.forEach((emp: any) => {
        const deptName = emp.department?.name || 'Unassigned';
        if (!byDept[deptName]) byDept[deptName] = { name: deptName, employees: [], count: 0 };
        byDept[deptName].employees.push({
          code: emp.employeeCode,
          name: emp.fullName,
          category: emp.category,
          type: emp.employmentType,
          status: emp.status,
        });
        byDept[deptName].count++;
      });

      if (id) {
        const dept = byDept[id];
        if (!dept) return { entity, message: 'Department not found', records: [] };
        const paginated = dept.employees.slice(skip, skip + limit);
        return { entity, total: dept.count, page, limit, totalPages: Math.ceil(dept.count / limit), records: paginated, name: id };
      }

      return { entity, total: depts.length, records: Object.values(byDept) };
    }

    if (entity === 'leave') {
      let query: Record<string, any> = {};
      if (id) query.employee = id;
      if (filters?.status) query.status = filters.status;
      if (period?.start && period?.end) {
        query.createdAt = { $gte: new Date(period.start), $lte: new Date(period.end) };
      }

      const [records, total] = await Promise.all([
        LeaveApplication.find(query)
          .populate('employee', 'fullName employeeCode')
          .populate('leaveType', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LeaveApplication.countDocuments(query),
      ]);

      return { entity, total, page, limit, totalPages: Math.ceil(total / limit), records };
    }

    return { entity, records: [], total: 0 };
  }

  static async getScheduledExportConfig(): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne().lean();
    return { config: (settings as any)?.reportsConfig || {} };
  }

  static async saveScheduledExportConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne();
    if (!settings) throw new Error('Company settings not found');
    (settings as any).reportsConfig = { ...((settings as any).reportsConfig || {}), ...config };
    settings.updatedBy = undefined as any;
    await settings.save();
    return { config: (settings as any).reportsConfig };
  }
}