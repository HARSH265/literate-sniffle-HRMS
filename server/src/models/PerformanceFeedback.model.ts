import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceFeedback extends Document {
  review: mongoose.Types.ObjectId;
  fromEmployee: mongoose.Types.ObjectId;
  relationship: 'peer' | 'subordinate' | 'other';
  rating: number;
  comments: string;
  submittedAt: Date;
}

const PerformanceFeedbackSchema = new Schema<IPerformanceFeedback>(
  {
    review: { type: Schema.Types.ObjectId, ref: 'PerformanceReview', required: true },
    fromEmployee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    relationship: {
      type: String,
      enum: ['peer', 'subordinate', 'other'],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 10 },
    comments: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

PerformanceFeedbackSchema.index({ review: 1, fromEmployee: 1 }, { unique: true });

const PerformanceFeedback = mongoose.model<IPerformanceFeedback>('PerformanceFeedback', PerformanceFeedbackSchema);

export default PerformanceFeedback;
