import Employee from '../../models/Employee.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import { ExcelGeneratorService } from '../../core/excel/ExcelGeneratorService.js';
import { Response } from 'express';

export class ReportsService {
  static async exportEmployees(filters: Record<string, unknown>, res: Response): Promise<void> {
    const filter: Record<string, unknown> = {};
    
    if (filters.status) filter.status = filters.status;
    if (filters.category) filter.category = filters.category;
    if (filters.department) filter.department = filters.department;

    const employees = await Employee.find(filter)
      .populate('department', 'name')
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
    const { month, year } = filters;
    
    if (!month || !year) {
      throw new Error('Month and year are required');
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const attendances = await AttendanceEntry.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('employee', 'fullName employeeCode')
      .lean();

    const employees = await Employee.find({ status: 'active' }).lean();

    const empMap: Record<string, any> = {};
    employees.forEach((emp: any) => {
      empMap[String(emp._id)] = emp;
    });

    const summary: Record<string, any> = {};
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    attendances.forEach((att: any) => {
      const empId = String(att.employee._id);
      if (!summary[empId]) {
        summary[empId] = {
          'Employee Code': att.employee.employeeCode,
          'Employee Name': att.employee.fullName,
          'Present': 0,
          'Absent': 0,
          'Half Day': 0,
          'Leave': 0,
          'Weekly Off': 0,
          'Holiday': 0,
          'Total Days': endDate.getDate(),
          'Working Days': 0,
        };
      }
      
      switch (att.status) {
        case 'present': summary[empId]['Present']++; break;
        case 'absent': summary[empId]['Absent']++; break;
        case 'half-day': summary[empId]['Half Day']++; break;
        case 'leave': summary[empId]['Leave']++; break;
        case 'weekly-off': summary[empId]['Weekly Off']++; break;
        case 'holiday': summary[empId]['Holiday']++; break;
      }
    });

    Object.values(summary).forEach((emp: any) => {
      emp['Working Days'] = emp['Present'] + (emp['Half Day'] * 0.5);
    });

    const data = Object.values(summary);

    await ExcelGeneratorService.generate(
      res,
      `Attendance_Report_${monthName.replace(' ', '_')}.xlsx`,
      'Attendance',
      [
        { header: 'Employee Code', key: 'Employee Code', width: 15 },
        { header: 'Employee Name', key: 'Employee Name', width: 20 },
        { header: 'Present', key: 'Present', width: 10 },
        { header: 'Absent', key: 'Absent', width: 10 },
        { header: 'Half Day', key: 'Half Day', width: 10 },
        { header: 'Leave', key: 'Leave', width: 10 },
        { header: 'Weekly Off', key: 'Weekly Off', width: 12 },
        { header: 'Holiday', key: 'Holiday', width: 10 },
        { header: 'Working Days', key: 'Working Days', width: 12 },
        { header: 'Total Days', key: 'Total Days', width: 12 },
      ],
      data,
    );
  }

  static async exportPayroll(filters: Record<string, unknown>, res: Response): Promise<void> {
    const { month } = filters;
    
    if (!month) {
      throw new Error('Month is required');
    }

    const run = await PayrollRun.findOne({ month: String(month) }).lean() as any;
    if (!run) {
      throw new Error('No payroll run found for this month');
    }

    const monthName = new Date(String(month) + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

    const data = [{
      'Payroll Month': monthName,
      'Status': run.status === 'finalized' ? 'Finalized' : 'Draft',
      'Total Employees': run.totalEmployees,
      'Total Net Pay': run.totalNetPay,
      'Processed Date': new Date(run.createdAt).toLocaleDateString(),
    }];

    await ExcelGeneratorService.generate(
      res,
      `Payroll_Summary_${monthName.replace(' ', '_')}.xlsx`,
      'Payroll Summary',
      [
        { header: 'Payroll Month', key: 'Payroll Month', width: 20 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'Total Employees', key: 'Total Employees', width: 18 },
        { header: 'Total Net Pay', key: 'Total Net Pay', width: 18 },
        { header: 'Processed Date', key: 'Processed Date', width: 15 },
      ],
      data,
    );
  }
}