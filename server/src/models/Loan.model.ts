import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoan extends Document {
  employee: mongoose.Types.ObjectId;
  loanType: mongoose.Types.ObjectId;
  applicationDate: Date;
  amount: number;
  interestRate: number;
  tenure: number;
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
  purpose?: string;
  status: 'applied' | 'approved' | 'rejected' | 'active' | 'closed' | 'cancelled';
  approvalLevels: {
    approvedBy: mongoose.Types.ObjectId;
    approvedAt: Date;
    level: number;
    remarks?: string;
  }[];
  disbursedDate?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  closedDate?: Date;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type LoanModel = Model<ILoan>;

const approvalLevelSchema = new Schema(
  {
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedAt: { type: Date, default: Date.now },
    level: { type: Number, required: true },
    remarks: { type: String },
  },
  { _id: false },
);

const LoanSchema = new Schema<ILoan>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    loanType: { type: Schema.Types.ObjectId, ref: 'LoanType', required: true },
    applicationDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 },
    tenure: { type: Number, required: true, min: 1 },
    emiAmount: { type: Number, required: true, min: 0 },
    totalPayable: { type: Number, required: true, min: 0 },
    totalInterest: { type: Number, required: true, min: 0 },
    purpose: { type: String },
    status: {
      type: String,
      enum: ['applied', 'approved', 'rejected', 'active', 'closed', 'cancelled'],
      default: 'applied',
    },
    approvalLevels: { type: [approvalLevelSchema], default: [] },
    disbursedDate: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedDate: { type: Date },
    remarks: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

LoanSchema.index({ employee: 1, status: 1 });
LoanSchema.index({ loanType: 1 });

const Loan = mongoose.model<ILoan, LoanModel>('Loan', LoanSchema);
export default Loan;
