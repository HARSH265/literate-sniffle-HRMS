import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'national' | 'state' | 'company' | 'festival';
  applicableTo: 'all' | 'worker' | 'office-staff';
  year: number;
  isPaid: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

interface HolidayModel extends Model<IHoliday> {}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['national', 'state', 'company', 'festival'],
      default: 'national',
    },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff'],
      default: 'all',
    },
    year: { type: Number, required: true },
    isPaid: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

HolidaySchema.index({ date: 1 });
HolidaySchema.index({ year: 1 });
HolidaySchema.index({ applicableTo: 1 });

const Holiday = mongoose.model<IHoliday, HolidayModel>('Holiday', HolidaySchema);

export default Holiday;