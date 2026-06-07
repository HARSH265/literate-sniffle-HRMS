import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  assetCode: string;
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  brand?: string;
  assetModel?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  condition: string;
  status: 'available' | 'allocated' | 'maintenance' | 'retired';
  location?: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  returnedAt?: Date;
  notes?: string;
  history: {
    employee?: mongoose.Types.ObjectId;
    action: 'allocated' | 'returned' | 'maintenance' | 'retired';
    date: Date;
    notes?: string;
  }[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String },
    serialNumber: { type: String },
    brand: { type: String },
    assetModel: { type: String },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    condition: { type: String, default: 'New' },
    status: {
      type: String,
      enum: ['available', 'allocated', 'maintenance', 'retired'],
      default: 'available',
    },
    location: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
    assignedAt: { type: Date },
    returnedAt: { type: Date },
    notes: { type: String },
    history: [
      {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
        action: {
          type: String,
          enum: ['allocated', 'returned', 'maintenance', 'retired'],
        },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AssetSchema.index({ status: 1, category: 1 });
AssetSchema.index({ assignedTo: 1 });

const Asset = mongoose.model<IAsset>('Asset', AssetSchema);

export default Asset;
