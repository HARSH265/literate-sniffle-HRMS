import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayrollRun extends Document {
  month: string;
  status: 'draft' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  processedBy: mongoose.Types.ObjectId;
  finalizedBy?: mongoose.Types.ObjectId;
  remarks?: string;
}

interface PayrollRunModel extends Model<IPayrollRun> {}

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    month: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
    },
    totalEmployees: { type: Number, default: 0 },
    totalNetPay: { type: Number, default: 0 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
  },
  { timestamps: true },
);

PayrollRunSchema.index({ status: 1 });

const PayrollRun = mongoose.model<IPayrollRun, PayrollRunModel>('PayrollRun', PayrollRunSchema);

export default PayrollRun;