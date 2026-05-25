import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveApplication extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentApprovalLevel: number;
  totalApprovalLevels: number;
  approvers: Array<{
    level: number;
    approver: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    remarks?: string;
    decidedAt?: Date;
  }>;
  isPaid: boolean;
  deductionMethod: 'none' | 'basic-only' | 'basic-plus-allowances' | 'gross';
  appliedBy: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

interface LeaveApplicationModel extends Model<ILeaveApplication> {}

const LeaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    documentUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    currentApprovalLevel: { type: Number, default: 1 },
    totalApprovalLevels: { type: Number, default: 1 },
    approvers: [
      {
        level: { type: Number, required: true },
        approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        remarks: { type: String },
        decidedAt: { type: Date },
      },
    ],
    isPaid: { type: Boolean, default: true },
    deductionMethod: {
      type: String,
      enum: ['none', 'basic-only', 'basic-plus-allowances', 'gross'],
      default: 'none',
    },
    appliedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

LeaveApplicationSchema.index({ employee: 1, startDate: -1 });
LeaveApplicationSchema.index({ status: 1 });
LeaveApplicationSchema.index({ 'approvers.approver': 1, status: 1 });

const LeaveApplication = mongoose.model<ILeaveApplication, LeaveApplicationModel>('LeaveApplication', LeaveApplicationSchema);

export default LeaveApplication;
