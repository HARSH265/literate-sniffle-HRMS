import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanType extends Document {
  name: string;
  code: string;
  description?: string;
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  maxTenure: number;
  minTenure: number;
  applicableTo: 'all' | 'worker' | 'office-staff';
  applicableEmploymentTypes: string[];
  maxActiveLoans: number;
  coolingOffPeriodDays: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

interface LoanTypeModel extends Model<ILoanType> {}

const LoanTypeSchema = new Schema<ILoanType>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    maxAmount: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, default: 0, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 },
    maxTenure: { type: Number, required: true, min: 1, max: 120 },
    minTenure: { type: Number, default: 1, min: 1 },
    applicableTo: { type: String, enum: ['all', 'worker', 'office-staff'], default: 'all' },
    applicableEmploymentTypes: { type: [String], default: [] },
    maxActiveLoans: { type: Number, default: 1, min: 1 },
    coolingOffPeriodDays: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const LoanType = mongoose.model<ILoanType, LoanTypeModel>('LoanType', LoanTypeSchema);
export default LoanType;
