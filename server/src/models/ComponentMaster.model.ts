import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComponentMaster extends Document {
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'employer-cost';
  subType: 'fixed' | 'variable' | 'reimbursement';
  taxable: boolean;
  partOfGross: boolean;
  partOfCtc: boolean;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  bonusApplicable: boolean;
  otBase: boolean;
  lopApplicable: boolean;
  arrearsApplicable: boolean;
  proRataOnJoin: boolean;
  showOnPayslip: boolean;
  calcType: 'fixed' | 'percentage-of-basic' | 'percentage-of-gross' | 'percentage-of-ctc' | 'formula' | 'slab';
  calcValue: number;
  calcReferenceComponent?: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  sortOrder: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type ComponentMasterModel = Model<IComponentMaster>;

const ComponentMasterSchema = new Schema<IComponentMaster>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['earning', 'deduction', 'employer-cost'],
    },
    subType: {
      type: String,
      required: true,
      enum: ['fixed', 'variable', 'reimbursement'],
      default: 'fixed',
    },
    taxable: { type: Boolean, default: true },
    partOfGross: { type: Boolean, default: true },
    partOfCtc: { type: Boolean, default: true },
    pfApplicable: { type: Boolean, default: false },
    esiApplicable: { type: Boolean, default: false },
    ptApplicable: { type: Boolean, default: false },
    bonusApplicable: { type: Boolean, default: false },
    otBase: { type: Boolean, default: false },
    lopApplicable: { type: Boolean, default: true },
    arrearsApplicable: { type: Boolean, default: true },
    proRataOnJoin: { type: Boolean, default: true },
    showOnPayslip: { type: Boolean, default: true },
    calcType: {
      type: String,
      required: true,
      enum: ['fixed', 'percentage-of-basic', 'percentage-of-gross', 'percentage-of-ctc', 'formula', 'slab'],
    },
    calcValue: { type: Number, required: true, min: 0 },
    calcReferenceComponent: { type: String },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ComponentMasterSchema.index({ code: 1 }, { unique: true });
ComponentMasterSchema.index({ type: 1, isActive: 1 });
ComponentMasterSchema.index({ isActive: 1 });

const ComponentMaster = mongoose.model<IComponentMaster, ComponentMasterModel>('ComponentMaster', ComponentMasterSchema);

export default ComponentMaster;
