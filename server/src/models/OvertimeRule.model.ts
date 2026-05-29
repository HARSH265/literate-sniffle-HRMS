import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOvertimeRule extends Document {
  name: string;
  applicableTo: 'all' | 'worker' | 'office-staff';
  multiplier: number;
  maxHoursPerDay: number;
  maxHoursPerMonth: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type OvertimeRuleModel = Model<IOvertimeRule>;

const OvertimeRuleSchema = new Schema<IOvertimeRule>(
  {
    name: { type: String, required: true, trim: true },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff'],
      default: 'all',
    },
    multiplier: { type: Number, required: true, min: 1 },
    maxHoursPerDay: { type: Number, required: true, min: 0 },
    maxHoursPerMonth: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const OvertimeRule = mongoose.model<IOvertimeRule, OvertimeRuleModel>('OvertimeRule', OvertimeRuleSchema);

export default OvertimeRule;