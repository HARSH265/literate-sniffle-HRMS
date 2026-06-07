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
  otEligibleEmpTypes?: string[];
  otEligibleGrades?: string[];
  otApprovalRequired: boolean;
  otPerHourDivisor?: string;
  normalDayMultiplier: number;
  weeklyOffMultiplier: number;
  holidayMultiplier: number;
  nightShiftMultiplier: number;
  minThresholdMinutes: number;
  maxPerWeekHours: number;
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
    otEligibleEmpTypes: { type: [String], default: ['worker'] },
    otEligibleGrades: { type: [String], default: [] },
    otApprovalRequired: { type: Boolean, default: true },
    otPerHourDivisor: { type: String, default: '26x8' },
    normalDayMultiplier: { type: Number, default: 2.0, min: 1 },
    weeklyOffMultiplier: { type: Number, default: 2.0, min: 1 },
    holidayMultiplier: { type: Number, default: 2.0, min: 1 },
    nightShiftMultiplier: { type: Number, default: 1.5, min: 1 },
    minThresholdMinutes: { type: Number, default: 30, min: 0 },
    maxPerWeekHours: { type: Number, default: 12, min: 0 },
  },
  { timestamps: true },
);

OvertimeRuleSchema.index({ isActive: 1 });
OvertimeRuleSchema.index({ applicableTo: 1 });
OvertimeRuleSchema.index({ isActive: 1, applicableTo: 1 });

const OvertimeRule = mongoose.model<IOvertimeRule, OvertimeRuleModel>('OvertimeRule', OvertimeRuleSchema);

export default OvertimeRule;