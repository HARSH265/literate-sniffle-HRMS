import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  maxDaysPerApplication: number;
  maxDaysPerYear: number;
  carryForward: boolean;
  carryForwardLimit: number;
  encashable: boolean;
  encashmentRatePercent: number;
  requiresDocuments: boolean;
  requiresApproval: boolean;
  approvalLevels: number;
  autoApproveThreshold: number;
  applicableToGender: 'all' | 'male' | 'female';
  applicableCategories: ('worker' | 'office-staff')[];
  applicableEmploymentTypes: ('permanent' | 'contract' | 'temporary' | 'trainee')[];
  deductionMethod: 'none' | 'basic-only' | 'basic-plus-allowances' | 'gross';
  accrualMethod: 'yearly-lump' | 'monthly-pro-rata' | 'manual';
  proRataOnJoin: boolean;
  allowNegativeBalance: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

interface LeaveTypeModel extends Model<ILeaveType> {}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    color: { type: String, default: '#4f46e5' },
    isPaid: { type: Boolean, default: true },
    maxDaysPerApplication: { type: Number, required: true, min: 1 },
    maxDaysPerYear: { type: Number, required: true, min: 0 },
    carryForward: { type: Boolean, default: false },
    carryForwardLimit: { type: Number, default: 0 },
    encashable: { type: Boolean, default: false },
    encashmentRatePercent: { type: Number, default: 100, min: 0, max: 100 },
    requiresDocuments: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },
    approvalLevels: { type: Number, default: 1, min: 1, max: 3 },
    autoApproveThreshold: { type: Number, default: 0, min: 0 },
    applicableToGender: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
    applicableCategories: {
      type: [String],
      enum: ['worker', 'office-staff'],
      default: ['worker', 'office-staff'],
    },
    applicableEmploymentTypes: {
      type: [String],
      enum: ['permanent', 'contract', 'temporary', 'trainee'],
      default: ['permanent', 'contract', 'temporary', 'trainee'],
    },
    deductionMethod: {
      type: String,
      enum: ['none', 'basic-only', 'basic-plus-allowances', 'gross'],
      default: 'none',
    },
    accrualMethod: {
      type: String,
      enum: ['yearly-lump', 'monthly-pro-rata', 'manual'],
      default: 'yearly-lump',
    },
    proRataOnJoin: { type: Boolean, default: true },
    allowNegativeBalance: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

LeaveTypeSchema.index({ isActive: 1, sortOrder: 1 });

const LeaveType = mongoose.model<ILeaveType, LeaveTypeModel>('LeaveType', LeaveTypeSchema);

export default LeaveType;
