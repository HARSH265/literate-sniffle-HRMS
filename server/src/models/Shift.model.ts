import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  applicableTo: 'all' | 'worker' | 'office-staff';
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type ShiftModel = Model<IShift>;

const ShiftSchema = new Schema<IShift>(
  {
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    workingHours: { type: Number, required: true, min: 1, max: 24 },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Shift = mongoose.model<IShift, ShiftModel>('Shift', ShiftSchema);

export default Shift;