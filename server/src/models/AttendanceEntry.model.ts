import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceEntry extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  shift: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  inTime?: string;
  outTime?: string;
  isLate?: boolean;
  isLateCount?: number;
  remarks?: string;
  source: 'manual-register-entry' | 'qr-kiosk' | 'supervisor-override';
  enteredBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  checkInMethod?: 'qr-biometric' | 'qr-totp' | 'supervisor' | 'manual';
  checkOutMethod?: 'qr-biometric' | 'qr-totp' | 'supervisor' | 'manual';
  checkInDeviceId?: string;
  checkOutDeviceId?: string;
  checkInGPS?: { latitude: number; longitude: number; accuracy?: number };
  checkOutGPS?: { latitude: number; longitude: number; accuracy?: number };
  checkInSelfieUrl?: string;
  checkOutSelfieUrl?: string;
  checkInTokenNonce?: string;
  checkOutTokenNonce?: string;
  totpVerified: boolean;
  biometricVerified: boolean;
  isLatePresent: boolean;
  supervisorOverride?: {
    overriddenBy: mongoose.Types.ObjectId;
    reason: string;
    at: Date;
  };
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
    isLate: { type: Boolean, default: false },
    isLateCount: { type: Number, default: 0 },
    remarks: { type: String },
    source: { type: String, default: 'manual-register-entry' },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkInMethod: { type: String, enum: ['qr-biometric', 'qr-totp', 'supervisor', 'manual'] },
    checkOutMethod: { type: String, enum: ['qr-biometric', 'qr-totp', 'supervisor', 'manual'] },
    checkInDeviceId: { type: String },
    checkOutDeviceId: { type: String },
    checkInGPS: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
    checkOutGPS: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
    checkInSelfieUrl: { type: String },
    checkOutSelfieUrl: { type: String },
    checkInTokenNonce: { type: String },
    checkOutTokenNonce: { type: String },
    totpVerified: { type: Boolean, default: false },
    biometricVerified: { type: Boolean, default: false },
    isLatePresent: { type: Boolean, default: false },
    supervisorOverride: {
      overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
      at: { type: Date },
    },
  },
  { timestamps: true },
);

AttendanceEntrySchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceEntrySchema.index({ date: 1 });
AttendanceEntrySchema.index({ status: 1 });

const AttendanceEntry = mongoose.model<IAttendanceEntry, AttendanceEntryModel>('AttendanceEntry', AttendanceEntrySchema);

export default AttendanceEntry;