import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AllowanceConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: 'all' | 'worker' | 'office-staff' | 'permanent' | 'contract' | 'temporary' | 'trainee';
  isActive: boolean;
}

export interface DeductionConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: 'all' | 'worker' | 'office-staff' | 'permanent' | 'contract' | 'temporary' | 'trainee';
  isActive: boolean;
}

export interface ICompanySettings extends Document {
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    financialYearStart: number;
  };
  payrollConfig: {
    overtimeBase: 'basic' | 'basicPlusAllowances';
    overtimeMultiplier: number;
    halfDayDeductionPercent: number;
    lateDeductionPerDay: number;
    paidWeeklyOff: boolean;
    paidHolidays: boolean;
    defaultWorkingDays: number;
    standardHoursPerDay: number;
    payrollLockDays: number;
  };
  attendanceConfig: {
    pastEntryLimitDays: number;
    lateMarkEnabled: boolean;
    lateMarkThresholdMinutes: number;
    lateToHalfDayAfterOccurrences: number;
  };
  allowanceConfig: AllowanceConfig[];
  deductionConfig: DeductionConfig[];
  emailConfig: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    fromAddress?: string;
  };
  updatedBy?: mongoose.Types.ObjectId;
}

interface CompanySettingsModel extends Model<ICompanySettings> {}

const allowanceConfigSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff', 'permanent', 'contract', 'temporary', 'trainee'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const deductionConfigSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff', 'permanent', 'contract', 'temporary', 'trainee'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyInfo: {
      name: { type: String, default: 'My Company' },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      logo: { type: String },
      financialYearStart: { type: Number, default: 4 },
    },
    payrollConfig: {
      overtimeBase: { type: String, enum: ['basic', 'basicPlusAllowances'], default: 'basic' },
      overtimeMultiplier: { type: Number, default: 2.0 },
      halfDayDeductionPercent: { type: Number, default: 50 },
      lateDeductionPerDay: { type: Number, default: 0 },
      paidWeeklyOff: { type: Boolean, default: true },
      paidHolidays: { type: Boolean, default: true },
      defaultWorkingDays: { type: Number, default: 26 },
      standardHoursPerDay: { type: Number, default: 8 },
      payrollLockDays: { type: Number, default: 10 },
    },
    attendanceConfig: {
      pastEntryLimitDays: { type: Number, default: 7 },
      lateMarkEnabled: { type: Boolean, default: false },
      lateMarkThresholdMinutes: { type: Number, default: 15 },
      lateToHalfDayAfterOccurrences: { type: Number, default: 3 },
    },
    allowanceConfig: { type: [allowanceConfigSchema], default: [
      { name: 'HRA', type: 'percentage', value: 20, applicableTo: 'all', isActive: true },
      { name: 'DA', type: 'percentage', value: 10, applicableTo: 'all', isActive: true },
      { name: 'Transport Allowance', type: 'fixed', value: 500, applicableTo: 'all', isActive: true },
      { name: 'Food Allowance', type: 'fixed', value: 300, applicableTo: 'all', isActive: true },
    ]},
    deductionConfig: { type: [deductionConfigSchema], default: []},
    emailConfig: {
      host: { type: String },
      port: { type: Number },
      user: { type: String },
      password: { type: String },
      fromAddress: { type: String },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const CompanySettings = mongoose.model<ICompanySettings, CompanySettingsModel>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;