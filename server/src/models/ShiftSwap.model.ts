import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftSwap extends Document {
  requestor: mongoose.Types.ObjectId;
  targetEmployee?: mongoose.Types.ObjectId;
  fromShift: mongoose.Types.ObjectId;
  toShift: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  isRecurring: boolean;
  recurringUntil?: Date;
  swapType: 'one-time' | 'recurring' | 'preference';
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSwapSchema = new Schema<IShiftSwap>(
  {
    requestor: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    targetEmployee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    fromShift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    toShift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    isRecurring: { type: Boolean, default: false },
    recurringUntil: { type: Date },
    swapType: {
      type: String,
      enum: ['one-time', 'recurring', 'preference'],
      default: 'one-time',
    },
  },
  { timestamps: true },
);

ShiftSwapSchema.index({ requestor: 1, status: 1, createdAt: -1 });
ShiftSwapSchema.index({ targetEmployee: 1, status: 1 });
ShiftSwapSchema.index({ status: 1, createdAt: -1 });
ShiftSwapSchema.index({ fromDate: 1, toDate: 1 });

const ShiftSwap = mongoose.model<IShiftSwap>('ShiftSwap', ShiftSwapSchema);
export default ShiftSwap;
