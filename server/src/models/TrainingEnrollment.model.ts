import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingEnrollment extends Document {
  training: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped' | 'certified';
  completionDate?: Date;
  score?: number;
  feedback?: string;
  rating?: number;
  certificationExpiry?: Date;
  certificationNumber?: string;
  certificateFile?: {
    url: string;
    name: string;
  };
  attendance: { date: Date; present: boolean }[];
}

const TrainingEnrollmentSchema = new Schema<ITrainingEnrollment>(
  {
    training: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['enrolled', 'in-progress', 'completed', 'dropped', 'certified'],
      default: 'enrolled',
    },
    completionDate: { type: Date },
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    certificationExpiry: { type: Date },
    certificationNumber: { type: String },
    certificateFile: {
      url: { type: String },
      name: { type: String },
    },
    attendance: [
      {
        date: { type: Date, required: true },
        present: { type: Boolean, default: true },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

TrainingEnrollmentSchema.index({ training: 1, employee: 1 }, { unique: true });
TrainingEnrollmentSchema.index({ employee: 1 });

const TrainingEnrollment = mongoose.model<ITrainingEnrollment>('TrainingEnrollment', TrainingEnrollmentSchema);

export default TrainingEnrollment;
