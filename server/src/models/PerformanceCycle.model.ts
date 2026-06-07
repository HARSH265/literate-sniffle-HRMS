import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceCycle extends Document {
  year: number;
  quarter: number;
  label: string;
  startDate: Date;
  goalDeadline: Date;
  selfReviewDeadline: Date;
  managerReviewDeadline: Date;
  closureDate: Date;
  status: 'upcoming' | 'active' | 'closed';
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
}

const PerformanceCycleSchema = new Schema<IPerformanceCycle>(
  {
    year: { type: Number, required: true },
    quarter: { type: Number, required: true, min: 1, max: 4 },
    label: { type: String, required: true },
    startDate: { type: Date, required: true },
    goalDeadline: { type: Date, required: true },
    selfReviewDeadline: { type: Date, required: true },
    managerReviewDeadline: { type: Date, required: true },
    closureDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed'],
      default: 'upcoming',
    },
    participants: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

PerformanceCycleSchema.index({ year: 1, quarter: 1 }, { unique: true });
PerformanceCycleSchema.index({ status: 1 });

const PerformanceCycle = mongoose.model<IPerformanceCycle>('PerformanceCycle', PerformanceCycleSchema);

export default PerformanceCycle;
