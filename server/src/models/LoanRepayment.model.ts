import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanRepayment extends Document {
  loan: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  month: string;
  amount: number;
  principal: number;
  interest: number;
  outstandingBefore: number;
  outstandingAfter: number;
  status: 'pending' | 'deducted' | 'missed' | 'paid';
  payrollRun?: mongoose.Types.ObjectId;
  repaidAt?: Date;
  remarks?: string;
}

type LoanRepaymentModel = Model<ILoanRepayment>;

const LoanRepaymentSchema = new Schema<ILoanRepayment>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    principal: { type: Number, required: true, min: 0 },
    interest: { type: Number, required: true, min: 0 },
    outstandingBefore: { type: Number, required: true, min: 0 },
    outstandingAfter: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'deducted', 'missed', 'paid'],
      default: 'pending',
    },
    payrollRun: { type: Schema.Types.ObjectId, ref: 'PayrollRun' },
    repaidAt: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true },
);

LoanRepaymentSchema.index({ loan: 1, month: 1 });
LoanRepaymentSchema.index({ employee: 1, month: 1 });

const LoanRepayment = mongoose.model<ILoanRepayment, LoanRepaymentModel>('LoanRepayment', LoanRepaymentSchema);
export default LoanRepayment;
