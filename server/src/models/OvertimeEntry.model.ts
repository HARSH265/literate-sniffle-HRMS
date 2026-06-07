import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOvertimeEntry extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  overtimeRule?: mongoose.Types.ObjectId;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  approvedHours?: number;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  shiftType: 'day' | 'night';
  otCategory: 'normal' | 'weekly-off' | 'holiday';
}

type OvertimeEntryModel = Model<IOvertimeEntry>;

const OvertimeEntrySchema = new Schema<IOvertimeEntry>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0 },
    overtimeRule: { type: Schema.Types.ObjectId, ref: 'OvertimeRule' },
    remarks: { type: String },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedHours: { type: Number, min: 0 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    shiftType: { type: String, enum: ['day', 'night'], default: 'day' },
    otCategory: {
      type: String,
      enum: ['normal', 'weekly-off', 'holiday'],
      default: 'normal',
    },
  },
  { timestamps: true },
);

OvertimeEntrySchema.index({ employee: 1, date: 1 }, { unique: true });
OvertimeEntrySchema.index({ employee: 1 });

const OvertimeEntry = mongoose.model<IOvertimeEntry, OvertimeEntryModel>('OvertimeEntry', OvertimeEntrySchema);

export default OvertimeEntry;