import mongoose from 'mongoose';

export interface LeanEmployee {
  _id: mongoose.Types.ObjectId;
  employeeCode: string;
  fullName: string;
  fatherName?: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department?: { _id: mongoose.Types.ObjectId; name: string; code?: string } | mongoose.Types.ObjectId;
  designation?: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId;
  shift?: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId;
  joiningDate?: Date;
  salaryType: 'monthly' | 'daily';
  baseSalary?: number;
  dailyWage?: number;
  status: 'active' | 'inactive' | 'terminated' | 'archived';
  contactNumber?: string;
  address?: string;
  [key: string]: unknown;
}

export interface LeanPayrollRun {
  _id: mongoose.Types.ObjectId;
  month: string;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  createdAt: Date;
  finalizedAt?: Date;
}

export interface LeanPayrollItem {
  _id: mongoose.Types.ObjectId;
  payrollRun: mongoose.Types.ObjectId;
  employee: { _id: mongoose.Types.ObjectId; fullName: string; employeeCode: string; department?: { _id: mongoose.Types.ObjectId; name: string } } | mongoose.Types.ObjectId;
  month: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  allowances?: { name: string; type: string; value: number; calculatedValue: number }[];
  deductions?: { name: string; type: string; value: number; calculatedValue: number }[];
  loanRepayment?: mongoose.Types.ObjectId;
}

export interface LeanAttendanceEntry {
  _id: mongoose.Types.ObjectId;
  employee: { _id: mongoose.Types.ObjectId; fullName: string; employeeCode: string } | mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  isLatePresent?: boolean;
}

export interface LeanOvertimeEntry {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  overtimeRule?: mongoose.Types.ObjectId;
  remarks?: string;
}

export interface LeanOvertimeRule {
  _id: mongoose.Types.ObjectId;
  name: string;
  multiplier: number;
  maxHoursPerDay?: number;
  maxHoursPerMonth?: number;
}

export interface LeanDepartment {
  _id: mongoose.Types.ObjectId;
  name: string;
  code?: string;
}

export interface LeanLeaveApplication {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  leaveType?: { _id: mongoose.Types.ObjectId; name: string; isPaid?: boolean; deductionMethod?: string };
  startDate: Date;
  endDate: Date;
  totalDays: number;
  status: string;
}

export interface PayrollConfig {
  overtimeBase?: 'basic' | 'basicPlusAllowances';
  overtimeMultiplier?: number;
  halfDayDeductionPercent?: number;
  lateDeductionPerDay?: number;
  paidWeeklyOff?: boolean;
  paidHolidays?: boolean;
  defaultWorkingDays?: number;
  standardHoursPerDay?: number;
  payrollLockDays?: number;
  unfinalizeWindowDays?: number;
  otTricksEnabled?: boolean;
  otRoundingMinutes?: number;
  otRoundingMethod?: 'floor' | 'ceil' | 'round';
  otMultiplierBasicOnly?: boolean;
}

export interface AllowanceItem {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: string;
  isActive: boolean;
}

export interface DeductionItem {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: string;
  isActive: boolean;
}

export interface AttendanceSummaryRow {
  'Employee Code': string;
  'Employee Name': string;
  'Department': string;
  'Present': number;
  'Absent': number;
  'Half Day': number;
  'Leave': number;
  'Weekly Off': number;
  'Holiday': number;
  'Paid WO': number;
  'Paid Holiday': number;
  'Total Days': number;
  'Working Days': number;
  [key: string]: string | number;
}
