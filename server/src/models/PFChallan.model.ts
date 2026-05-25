import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPFChallan extends Document {
  month: string;
  financialYear: string;
  generationDate: Date;
  status: 'pending' | 'generated' | 'paid' | 'filed';
  totalWages: number;
  employeeCount: number;
  employeePfContribution: number;
  employerPfContribution: number;
  epsContribution: number;
  edliContribution: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  totalAmount: number;
  paymentDate?: Date;
  transactionRef?: string;
  challanId?: string;
  remarks?: string;
  generatedBy: mongoose.Types.ObjectId;
}

interface PFChallanModel extends Model<IPFChallan> {}

const PFChallanSchema = new Schema<IPFChallan>(
  {
    month: { type: String, required: true },
    financialYear: { type: String, required: true },
    generationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'generated', 'paid', 'filed'],
      default: 'pending',
    },
    totalWages: { type: Number, required: true },
    employeeCount: { type: Number, required: true },
    employeePfContribution: { type: Number, required: true },
    employerPfContribution: { type: Number, required: true },
    epsContribution: { type: Number, default: 0 },
    edliContribution: { type: Number, default: 0 },
    pfAdminCharges: { type: Number, default: 0 },
    edliAdminCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentDate: { type: Date },
    transactionRef: { type: String },
    challanId: { type: String },
    remarks: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

PFChallanSchema.index({ month: 1, financialYear: 1 });
PFChallanSchema.index({ status: 1 });

const PFChallan = mongoose.model<IPFChallan, PFChallanModel>('PFChallan', PFChallanSchema);

export default PFChallan;
