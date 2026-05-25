import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKioskDevice extends Document {
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isActive: boolean;
  lastSeenAt?: Date;
  registeredBy: mongoose.Types.ObjectId;
}

interface KioskDeviceModel extends Model<IKioskDevice> {}

const KioskDeviceSchema = new Schema<IKioskDevice>(
  {
    name: { type: String, required: true, trim: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
    },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const KioskDevice = mongoose.model<IKioskDevice, KioskDeviceModel>('KioskDevice', KioskDeviceSchema);

export default KioskDevice;
