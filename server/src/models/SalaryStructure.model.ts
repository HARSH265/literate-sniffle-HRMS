import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SalaryStructureComponent {
  component: mongoose.Types.ObjectId;
  calcType?: string;
  calcValue?: number;
  monthlyAmount: number;
  isActive: boolean;
}

export interface ISalaryStructure extends Document {
  employee: mongoose.Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  components: SalaryStructureComponent[];
  totalCtc: number;
  grossMonthly: number;
  totalMonthlyDeductions: number;
  netMonthly: number;
  isCurrent: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type SalaryStructureModel = Model<ISalaryStructure>;

const salaryComponentSchema = new Schema(
  {
    component: { type: Schema.Types.ObjectId, ref: 'ComponentMaster', required: true },
    calcType: { type: String },
    calcValue: { type: Number },
    monthlyAmount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    components: { type: [salaryComponentSchema], default: [] },
    totalCtc: { type: Number, default: 0 },
    grossMonthly: { type: Number, default: 0 },
    totalMonthlyDeductions: { type: Number, default: 0 },
    netMonthly: { type: Number, default: 0 },
    isCurrent: { type: Boolean, default: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

SalaryStructureSchema.index({ employee: 1, isCurrent: 1 });
SalaryStructureSchema.index({ employee: 1, effectiveFrom: -1 });

const SalaryStructure = mongoose.model<ISalaryStructure, SalaryStructureModel>('SalaryStructure', SalaryStructureSchema);

export default SalaryStructure;
