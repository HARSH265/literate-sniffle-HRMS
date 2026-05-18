import Employee from '../../models/Employee.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import OvertimeRule from '../../models/OvertimeRule.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
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
}