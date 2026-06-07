import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingProgram extends Document {
  title: string;
  description: string;
  category: string;
  mode: string;
  duration: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  trainer: string;
  location: string;
  cost: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  certificationOffered: boolean;
  certificationValidForDays: number;
  prerequisites: string[];
  tags: string[];
  materials: { name: string; url: string }[];
  createdBy: mongoose.Types.ObjectId;
}

const TrainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    mode: { type: String, required: true },
    duration: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['hours', 'days', 'weeks'], required: true },
    },
    maxParticipants: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    trainer: { type: String, default: '' },
    location: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    certificationOffered: { type: Boolean, default: false },
    certificationValidForDays: { type: Number, default: 0 },
    prerequisites: [{ type: String }],
    tags: [{ type: String }],
    materials: [
      {
        name: { type: String },
        url: { type: String },
        _id: false,
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

TrainingProgramSchema.index({ status: 1, category: 1 });
TrainingProgramSchema.index({ startDate: 1 });

const TrainingProgram = mongoose.model<ITrainingProgram>('TrainingProgram', TrainingProgramSchema);

export default TrainingProgram;
