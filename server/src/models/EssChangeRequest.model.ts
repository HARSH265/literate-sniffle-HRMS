import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEssChangeRequest extends Document {
  employee: mongoose.Types.ObjectId;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

type EssChangeRequestModel = Model<IEssChangeRequest>;

const EssChangeRequestSchema = new Schema<IEssChangeRequest>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

EssChangeRequestSchema.index({ employee: 1, status: 1 });
EssChangeRequestSchema.index({ status: 1, createdAt: -1 });

const EssChangeRequest = mongoose.model<IEssChangeRequest, EssChangeRequestModel>('EssChangeRequest', EssChangeRequestSchema);

export default EssChangeRequest;
