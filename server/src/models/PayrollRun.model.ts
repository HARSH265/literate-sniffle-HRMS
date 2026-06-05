import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PayrollRevision {
  action: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  changes?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApprovalHistoryEntry {
  action: 'submitted' | 'approved' | 'rejected' | 'finalized' | 'unfinalized';
  userId: mongoose.Types.ObjectId;
  userName: string;
  role: string;
  comments?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface IPayrollRun extends Document {
  month: string;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  processedBy: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  finalizedBy?: mongoose.Types.ObjectId;
  finalizedAt?: Date;
  payGroup?: string;
  payPeriod?: string;
  attendanceFreezeDate?: Date;
  batchId?: string;
  isSupplementary: boolean;
  complianceStatus?: 'pass' | 'warning' | 'fail' | 'pending';
  complianceReport?: Record<string, unknown>;
  remarks?: string;
  revisions: PayrollRevision[];
  approvalHistory: ApprovalHistoryEntry[];
  updatedBy?: mongoose.Types.ObjectId;
}

type PayrollRunModel = Model<IPayrollRun>;

const revisionSchema = new Schema(
  {
    action: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const approvalHistorySchema = new Schema(
  {
    action: { type: String, enum: ['submitted', 'approved', 'rejected', 'finalized', 'unfinalized'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    role: { type: String, required: true },
    comments: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    month: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'finalized'],
      default: 'draft',
    },
    totalEmployees: { type: Number, default: 0 },
    totalNetPay: { type: Number, default: 0 },
    totalGrossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalEmployerContributions: { type: Number, default: 0 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    finalizedAt: { type: Date },
    payGroup: { type: String },
    payPeriod: { type: String },
    attendanceFreezeDate: { type: Date },
    batchId: { type: String },
    isSupplementary: { type: Boolean, default: false },
    complianceStatus: { type: String, enum: ['pass', 'warning', 'fail', 'pending'] },
    complianceReport: { type: Schema.Types.Mixed },
    remarks: { type: String },
    revisions: { type: [revisionSchema], default: [] },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

PayrollRunSchema.index({ status: 1 });

const PayrollRun = mongoose.model<IPayrollRun, PayrollRunModel>('PayrollRun', PayrollRunSchema);

export default PayrollRun;