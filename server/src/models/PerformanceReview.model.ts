import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal {
  title: string;
  description: string;
  weight: number;
  targetValue?: string;
  actualValue?: string;
  category?: string;
  selfRating?: number;
  managerRating?: number;
  comments?: string;
}

export interface IPerformanceReview extends Document {
  employee: mongoose.Types.ObjectId;
  reviewCycle: mongoose.Types.ObjectId;
  reviewPeriod: {
    year: number;
    quarter: number;
    label: string;
  };
  status: 'draft' | 'goals-set' | 'self-review' | 'manager-review' | 'completed' | 'appealed';
  goals: IGoal[];
  selfReview?: {
    rating: number;
    overallComment: string;
    strengths?: string;
    improvements?: string;
    submittedAt: Date;
  };
  managerReview?: {
    rating: number;
    overallComment: string;
    strengths?: string;
    improvements?: string;
    submittedAt: Date;
    reviewer: mongoose.Types.ObjectId;
  };
  overallRating?: number;
  finalRating?: number;
  isAppealed: boolean;
  appealReason?: string;
  appealResolution?: string;
  reviewerNotes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    weight: { type: Number, required: true, min: 1, max: 100 },
    targetValue: { type: String },
    actualValue: { type: String },
    category: { type: String },
    selfRating: { type: Number, min: 1, max: 10 },
    managerRating: { type: Number, min: 1, max: 10 },
    comments: { type: String },
  },
  { _id: false },
);

const PerformanceReviewSchema = new Schema<IPerformanceReview>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    reviewCycle: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
    reviewPeriod: {
      year: { type: Number, required: true },
      quarter: { type: Number, required: true },
      label: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['draft', 'goals-set', 'self-review', 'manager-review', 'completed', 'appealed'],
      default: 'draft',
    },
    goals: { type: [GoalSchema], default: [] },
    selfReview: {
      rating: { type: Number, min: 1, max: 10 },
      overallComment: { type: String },
      strengths: { type: String },
      improvements: { type: String },
      submittedAt: { type: Date },
    },
    managerReview: {
      rating: { type: Number, min: 1, max: 10 },
      overallComment: { type: String },
      strengths: { type: String },
      improvements: { type: String },
      submittedAt: { type: Date },
      reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    overallRating: { type: Number, min: 1, max: 10 },
    finalRating: { type: Number, min: 1, max: 10 },
    isAppealed: { type: Boolean, default: false },
    appealReason: { type: String },
    appealResolution: { type: String },
    reviewerNotes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

PerformanceReviewSchema.index({ employee: 1, reviewCycle: 1 }, { unique: true });
PerformanceReviewSchema.index({ status: 1 });
PerformanceReviewSchema.index({ 'reviewPeriod.year': 1, 'reviewPeriod.quarter': 1 });

const PerformanceReview = mongoose.model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);

export default PerformanceReview;
