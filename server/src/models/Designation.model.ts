import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDesignation extends Document {
  name: string;
  department: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

type DesignationModel = Model<IDesignation>;

const DesignationSchema = new Schema<IDesignation>(
  {
    name: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

DesignationSchema.index({ department: 1 });

const Designation = mongoose.model<IDesignation, DesignationModel>('Designation', DesignationSchema);

export default Designation;