import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PayrollRevision {
  action: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  changes?: Record<string, unknown>;
  timestamp: Date;
}

export interface IPayrollRun extends Document {
  month: string;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  processedBy: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  finalizedBy?: mongoose.Types.ObjectId;
  finalizedAt?: Date;
  remarks?: string;
  revisions: PayrollRevision[];
  updatedBy?: mongoose.Types.ObjectId;
}

interface PayrollRunModel extends Model<IPayrollRun> {}

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
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    finalizedAt: { type: Date },
    remarks: { type: String },
    revisions: { type: [revisionSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

PayrollRunSchema.index({ status: 1 });

const PayrollRun = mongoose.model<IPayrollRun, PayrollRunModel>('PayrollRun', PayrollRunSchema);

export default PayrollRun;