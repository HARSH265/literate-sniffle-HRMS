import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveBalance extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  year: number;
  totalEntitled: number;
  totalUsed: number;
  totalPending: number;
  carryForwardFromPrev: number;
  balance: number;
  lastAccruedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type LeaveBalanceModel = Model<ILeaveBalance>;

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    year: { type: Number, required: true },
    totalEntitled: { type: Number, required: true, min: 0 },
    totalUsed: { type: Number, default: 0, min: 0 },
    totalPending: { type: Number, default: 0, min: 0 },
    carryForwardFromPrev: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    lastAccruedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

LeaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });
LeaveBalanceSchema.index({ employee: 1, year: 1 });

const LeaveBalance = mongoose.model<ILeaveBalance, LeaveBalanceModel>('LeaveBalance', LeaveBalanceSchema);

export default LeaveBalance;
