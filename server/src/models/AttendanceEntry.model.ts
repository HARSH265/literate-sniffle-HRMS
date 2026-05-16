import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceEntry extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  shift: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  inTime?: string;
  outTime?: string;
  overtimeHours: number;
  remarks?: string;
  source: 'manual-register-entry';
  enteredBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

interface AttendanceEntryModel extends Model<IAttendanceEntry> {}

const AttendanceEntrySchema = new Schema<IAttendanceEntry>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday'],
    },
    inTime: { type: String },
    outTime: { type: String },
    overtimeHours: { type: Number, default: 0, min: 0 },
    remarks: { type: String },
    source: { type: String, default: 'manual-register-entry' },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

AttendanceEntrySchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceEntrySchema.index({ date: 1 });
AttendanceEntrySchema.index({ status: 1 });

const AttendanceEntry = mongoose.model<IAttendanceEntry, AttendanceEntryModel>('AttendanceEntry', AttendanceEntrySchema);

export default AttendanceEntry;