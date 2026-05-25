import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayrollItem extends Document {
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
  netPay: number;
  status: 'draft' | 'finalized';
}

interface PayrollItemModel extends Model<IPayrollItem> {}

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
    netPay: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
    },
  },
  { timestamps: true },
);

PayrollItemSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
PayrollItemSchema.index({ month: 1 });
PayrollItemSchema.index({ employee: 1 });

const PayrollItem = mongoose.model<IPayrollItem, PayrollItemModel>('PayrollItem', PayrollItemSchema);

export default PayrollItem;