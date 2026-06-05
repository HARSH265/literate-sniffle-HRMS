import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ComponentEarning {
  componentCode?: string;
  componentName: string;
  component?: { code: string; name: string; id: string };
  type: 'earning';
  subType: 'fixed' | 'variable' | 'reimbursement';
  calcType?: string;
  calcValue?: number;
  monthlyAmount?: number;
  computedAmount?: number;
  taxable: boolean;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  lopApplicable: boolean;
  arrearsApplicable?: boolean;
  otBase: boolean;
  monthlyValue: number;
  earnedValue: number;
  calculatedValue: number;
}

export interface ComponentDeduction {
  componentCode?: string;
  componentName: string;
  component?: { code: string; name: string; id: string };
  type: 'deduction';
  subType: 'fixed' | 'variable' | 'statutory';
  calcType?: string;
  calcValue?: number;
  monthlyAmount?: number;
  computedAmount?: number;
  taxable: boolean;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  lopApplicable?: boolean;
  arrearsApplicable?: boolean;
  monthlyValue: number;
  earnedValue: number;
  calculatedValue: number;
}

export interface EmployerContribution {
  name: string;
  calculatedValue: number;
  rate?: number;
  baseAmount?: number;
}

export interface PaidDaysBreakdown {
  calendarDays: number;
  payableDaysBase: number;
  paidDays: number;
  lopDays: number;
  calculationMethod: '30' | 'actual' | '26';
  proRataFactor: number;
}

export interface TaxComputation {
  taxRegime: 'old' | 'new';
  projectedAnnualGross: number;
  projectedAnnualDeductions: number;
  projectedTaxableIncome: number;
  annualTaxAmount: number;
  surcharge: number;
  educationCess: number;
  totalTaxLiability: number;
  monthlyTds: number;
  ytdTdsDeducted: number;
  rebate87a: number;
}

export interface ArrearsDetails {
  earningArrears: number;
  deductionArrears: number;
  pfArrears: number;
  esiArrears: number;
  taxArrears: number;
  previousMonthAdjustment: number;
  reason?: string;
}

export interface LopDetails {
  lopDays: number;
  lopAmount: number;
  calculationMethod: '30' | 'actual' | '26';
  perDayRate: number;
  componentsAffected: string[];
}

export interface ProRataDetails {
  isJoiner: boolean;
  isLeaver: boolean;
  joinDate?: Date;
  leaveDate?: Date;
  daysWorked: number;
  totalDays: number;
  proRataFactor: number;
}

export interface ComplianceCheck {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  actualValue: number;
  requiredValue: number;
  gap: number;
  notes?: string;
}

export interface PreviousMonthComparison {
  previousMonth: string;
  previousGrossPay: number;
  previousNetPay: number;
  previousTotalDeductions: number;
  grossPayVariance: number;
  netPayVariance: number;
  variancePercent: number;
}

export interface VariableInput {
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  reason?: string;
}

export interface IPayrollItem extends Document {
  bankSplitPercent?: number;
  primaryBankAmount?: number;
  secondaryBankAmount?: number;
  payrollRun: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  month: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffs: number;
  holidays: number;
  effectiveWorkingDays: number;
  overtimeHours: number;
  overtimeHoursAllowed?: number;
  overtimeRuleApplied?: {
    name: string;
    multiplier: number;
  };
  overtimeAmount: number;
  basicEarnings: number;
  allowances: {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    calculatedValue: number;
  }[];
  grossEarnings: number;
  deductions: {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    calculatedValue: number;
  }[];
  totalDeductions: number;
  employerContributions: EmployerContribution[];
  loanEmiDeduction: number;
  loanRepayment?: mongoose.Types.ObjectId;
  netPay: number;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  componentWiseEarnings: ComponentEarning[];
  componentWiseDeductions: ComponentDeduction[];
  paidDaysBreakdown?: PaidDaysBreakdown;
  taxComputation?: TaxComputation;
  arrears?: ArrearsDetails;
  lopDetails?: LopDetails;
  proRataDetails?: ProRataDetails;
  complianceFlags: ComplianceCheck[];
  previousMonthComparison?: PreviousMonthComparison;
  variableInputs: VariableInput[];
}

const componentEarningSchema = new Schema(
  {
    componentCode: { type: String },
    componentName: { type: String, required: true },
    type: { type: String, enum: ['earning'], default: 'earning' },
    subType: { type: String, enum: ['fixed', 'variable', 'reimbursement'], default: 'fixed' },
    taxable: { type: Boolean, default: true },
    pfApplicable: { type: Boolean, default: false },
    esiApplicable: { type: Boolean, default: false },
    ptApplicable: { type: Boolean, default: false },
    lopApplicable: { type: Boolean, default: true },
    otBase: { type: Boolean, default: false },
    monthlyValue: { type: Number, default: 0 },
    earnedValue: { type: Number, default: 0 },
    calculatedValue: { type: Number, default: 0 },
  },
  { _id: false },
);

const componentDeductionSchema = new Schema(
  {
    componentCode: { type: String },
    componentName: { type: String, required: true },
    type: { type: String, enum: ['deduction'], default: 'deduction' },
    subType: { type: String, enum: ['fixed', 'variable', 'statutory'], default: 'fixed' },
    taxable: { type: Boolean, default: false },
    pfApplicable: { type: Boolean, default: false },
    esiApplicable: { type: Boolean, default: false },
    ptApplicable: { type: Boolean, default: false },
    monthlyValue: { type: Number, default: 0 },
    earnedValue: { type: Number, default: 0 },
    calculatedValue: { type: Number, default: 0 },
  },
  { _id: false },
);

const employerContributionSchema = new Schema(
  {
    name: { type: String, required: true },
    calculatedValue: { type: Number, default: 0 },
    rate: { type: Number },
    baseAmount: { type: Number },
  },
  { _id: false },
);

const paidDaysBreakdownSchema = new Schema(
  {
    calendarDays: { type: Number, default: 0 },
    payableDaysBase: { type: Number, default: 30 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },
    calculationMethod: { type: String, enum: ['30', 'actual', '26'], default: '30' },
    proRataFactor: { type: Number, default: 1 },
  },
  { _id: false },
);

const taxComputationSchema = new Schema(
  {
    taxRegime: { type: String, enum: ['old', 'new'] },
    projectedAnnualGross: { type: Number, default: 0 },
    projectedAnnualDeductions: { type: Number, default: 0 },
    projectedTaxableIncome: { type: Number, default: 0 },
    annualTaxAmount: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    educationCess: { type: Number, default: 0 },
    totalTaxLiability: { type: Number, default: 0 },
    monthlyTds: { type: Number, default: 0 },
    ytdTdsDeducted: { type: Number, default: 0 },
    rebate87a: { type: Number, default: 0 },
  },
  { _id: false },
);

const arrearsSchema = new Schema(
  {
    earningArrears: { type: Number, default: 0 },
    deductionArrears: { type: Number, default: 0 },
    pfArrears: { type: Number, default: 0 },
    esiArrears: { type: Number, default: 0 },
    taxArrears: { type: Number, default: 0 },
    previousMonthAdjustment: { type: Number, default: 0 },
    reason: { type: String },
  },
  { _id: false },
);

const lopDetailsSchema = new Schema(
  {
    lopDays: { type: Number, default: 0 },
    lopAmount: { type: Number, default: 0 },
    calculationMethod: { type: String, enum: ['30', 'actual', '26'], default: '30' },
    perDayRate: { type: Number, default: 0 },
    componentsAffected: { type: [String], default: [] },
  },
  { _id: false },
);

const proRataDetailsSchema = new Schema(
  {
    isJoiner: { type: Boolean, default: false },
    isLeaver: { type: Boolean, default: false },
    joinDate: { type: Date },
    leaveDate: { type: Date },
    daysWorked: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    proRataFactor: { type: Number, default: 1 },
  },
  { _id: false },
);

const complianceCheckSchema = new Schema(
  {
    check: { type: String, required: true },
    status: { type: String, enum: ['pass', 'warning', 'fail'], required: true },
    actualValue: { type: Number, default: 0 },
    requiredValue: { type: Number, default: 0 },
    gap: { type: Number, default: 0 },
    notes: { type: String },
  },
  { _id: false },
);

const previousMonthComparisonSchema = new Schema(
  {
    previousMonth: { type: String },
    previousGrossPay: { type: Number, default: 0 },
    previousNetPay: { type: Number, default: 0 },
    previousTotalDeductions: { type: Number, default: 0 },
    grossPayVariance: { type: Number, default: 0 },
    netPayVariance: { type: Number, default: 0 },
    variancePercent: { type: Number, default: 0 },
  },
  { _id: false },
);

const variableInputSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['earning', 'deduction'], required: true },
    amount: { type: Number, default: 0 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    reason: { type: String },
  },
  { _id: false },
);

type PayrollItemModel = Model<IPayrollItem>;

const PayrollItemSchema = new Schema<IPayrollItem>(
  {
    payrollRun: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true },
    totalDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, required: true },
    halfDays: { type: Number, required: true },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    weeklyOffs: { type: Number, required: true },
    holidays: { type: Number, required: true },
    effectiveWorkingDays: { type: Number, required: true },
    overtimeHours: { type: Number, default: 0 },
    overtimeHoursAllowed: { type: Number, default: 0 },
    overtimeRuleApplied: {
      name: { type: String },
      multiplier: { type: Number },
    },
    overtimeAmount: { type: Number, default: 0 },
    basicEarnings: { type: Number, required: true },
    allowances: [
      {
        name: { type: String },
        type: { type: String, enum: ['fixed', 'percentage'] },
        value: { type: Number },
        calculatedValue: { type: Number },
      },
    ],
    grossEarnings: { type: Number, required: true },
    deductions: [
      {
        name: { type: String },
        type: { type: String, enum: ['fixed', 'percentage'] },
        value: { type: Number },
        calculatedValue: { type: Number },
      },
    ],
    totalDeductions: { type: Number, required: true },
    employerContributions: { type: [employerContributionSchema], default: [] },
    loanEmiDeduction: { type: Number, default: 0 },
    loanRepayment: { type: Schema.Types.ObjectId, ref: 'LoanRepayment' },
    netPay: { type: Number, required: true },
    bankSplitPercent: { type: Number, min: 0, max: 100 },
    primaryBankAmount: { type: Number },
    secondaryBankAmount: { type: Number },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'finalized'],
      default: 'draft',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    componentWiseEarnings: { type: [componentEarningSchema], default: [] },
    componentWiseDeductions: { type: [componentDeductionSchema], default: [] },
    paidDaysBreakdown: { type: paidDaysBreakdownSchema },
    taxComputation: { type: taxComputationSchema },
    arrears: { type: arrearsSchema },
    lopDetails: { type: lopDetailsSchema },
    proRataDetails: { type: proRataDetailsSchema },
    complianceFlags: { type: [complianceCheckSchema], default: [] },
    previousMonthComparison: { type: previousMonthComparisonSchema },
    variableInputs: { type: [variableInputSchema], default: [] },
  },
  { timestamps: true },
);

PayrollItemSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
PayrollItemSchema.index({ month: 1 });
PayrollItemSchema.index({ employee: 1 });
PayrollItemSchema.index({ loanRepayment: 1 });

const PayrollItem = mongoose.model<IPayrollItem, PayrollItemModel>('PayrollItem', PayrollItemSchema);

export default PayrollItem;
