import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

interface DepartmentModel extends Model<IDepartment> {}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Department = mongoose.model<IDepartment, DepartmentModel>('Department', DepartmentSchema);

export default Department;