import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeeklyOffRule extends Document {
  name: string;
  category: 'all' | 'worker' | 'office-staff';
  offDays: number[];
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type WeeklyOffRuleModel = Model<IWeeklyOffRule>;

const WeeklyOffRuleSchema = new Schema<IWeeklyOffRule>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['all', 'worker', 'office-staff'],
      default: 'all',
    },
    offDays: { type: [Number], required: true, validate: {
      validator: (v: number[]) => v.every((d) => d >= 0 && d <= 6),
      message: 'Off days must be between 0 and 6',
    }},
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const WeeklyOffRule = mongoose.model<IWeeklyOffRule, WeeklyOffRuleModel>('WeeklyOffRule', WeeklyOffRuleSchema);

export default WeeklyOffRule;