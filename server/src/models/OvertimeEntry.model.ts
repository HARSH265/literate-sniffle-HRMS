import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOvertimeEntry extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  overtimeRule?: mongoose.Types.ObjectId;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
}

interface OvertimeEntryModel extends Model<IOvertimeEntry> {}

const OvertimeEntrySchema = new Schema<IOvertimeEntry>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0 },
    overtimeRule: { type: Schema.Types.ObjectId, ref: 'OvertimeRule' },
    remarks: { type: String },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

OvertimeEntrySchema.index({ employee: 1, date: 1 });
OvertimeEntrySchema.index({ employee: 1 });

const OvertimeEntry = mongoose.model<IOvertimeEntry, OvertimeEntryModel>('OvertimeEntry', OvertimeEntrySchema);

export default OvertimeEntry;