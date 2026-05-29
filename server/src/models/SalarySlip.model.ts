import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalarySlip extends Document {
  payrollItem: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  month: string;
  slipNumber: string;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  isDownloaded: boolean;
}

type SalarySlipModel = Model<ISalarySlip>;

const SalarySlipSchema = new Schema<ISalarySlip>(
  {
    payrollItem: { type: Schema.Types.ObjectId, ref: 'PayrollItem', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true },
    slipNumber: { type: String, required: true, unique: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, required: true },
    isDownloaded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

SalarySlipSchema.index({ slipNumber: 1 }, { unique: true });
SalarySlipSchema.index({ employee: 1 });
SalarySlipSchema.index({ month: 1 });

const SalarySlip = mongoose.model<ISalarySlip, SalarySlipModel>('SalarySlip', SalarySlipSchema);

export default SalarySlip;