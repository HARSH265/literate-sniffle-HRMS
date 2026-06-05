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
  totalGrossPay: number;
  totalDeductions: number;
  totalEmployerContributions?: number;
  processedBy?: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  finalizedBy?: mongoose.Types.ObjectId;
  finalizedAt?: Date;
  isSupplementary?: boolean;
  complianceStatus?: 'pass' | 'warning' | 'fail' | 'pending';
  complianceReport?: Record<string, unknown>;
  remarks?: string;
  revisions?: Array<{ action: string; userId: mongoose.Types.ObjectId; userName: string; changes?: Record<string, unknown>; timestamp: Date }>;
  approvalHistory?: Array<{ action: 'submitted' | 'approved' | 'rejected' | 'finalized' | 'unfinalized'; userId: mongoose.Types.ObjectId; userName: string; role: string; comments?: string; ipAddress?: string; timestamp: Date }>;
  createdAt: Date;
  updatedAt?: Date;
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
  status?: 'draft' | 'submitted' | 'approved' | 'finalized';
  bankSplitPercent?: number;
  primaryBankAmount?: number;
  secondaryBankAmount?: number;
  paidDaysBreakdown?: { calendarDays: number; payableDaysBase: number; paidDays: number; lopDays: number; calculationMethod: '30' | 'actual' | '26'; proRataFactor: number };
  lopDetails?: { lopDays: number; lopAmount: number; calculationMethod: '30' | 'actual' | '26'; perDayRate: number; componentsAffected: string[] };
  proRataDetails?: { isJoiner: boolean; isLeaver: boolean; joinDate?: Date; leaveDate?: Date; daysWorked: number; totalDays: number; proRataFactor: number };
  complianceFlags?: Array<{ check: string; status: 'pass' | 'warning' | 'fail'; actualValue: number; requiredValue: number; gap: number; notes?: string }>;
  taxComputation?: {
    regime: 'old' | 'new';
    projectedAnnualGross: number;
    projectedAnnualExemptions: number;
    projectedTaxableIncome: number;
    annualTaxAmount: number;
    surcharge: number;
    educationCess: number;
    totalTaxLiability: number;
    monthlyTds: number;
    rebate87a: number;
  };
  arrears?: Array<{ component: { code: string; name: string; id: string }; month: string; previousAmount: number; currentAmount: number; difference: number; isPositive: boolean; applicableArrearDays: number; effectiveArrearAmount: number }>;
  componentWiseEarnings?: Array<any>;
  componentWiseDeductions?: Array<any>;
  previousMonthComparison?: { previousMonth: string; previousGrossPay: number; previousNetPay: number; previousTotalDeductions: number; grossEarningsVariance: number; netPayVariance: number; variancePercent: number };
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
