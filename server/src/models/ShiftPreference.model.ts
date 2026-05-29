import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftPreference extends Document {
  employee: mongoose.Types.ObjectId;
  preferredShift: mongoose.Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  priority: number;
  reason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftPreferenceSchema = new Schema<IShiftPreference>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    preferredShift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    priority: { type: Number, default: 1, min: 1, max: 10 },
    reason: { type: String, trim: true, maxlength: 500 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ShiftPreferenceSchema.index({ preferredShift: 1 });

const ShiftPreference = mongoose.model<IShiftPreference>('ShiftPreference', ShiftPreferenceSchema);
export default ShiftPreference;
