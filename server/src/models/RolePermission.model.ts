import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRolePermission extends Document {
  role: string;
  permissions: string[];
  isCustom: boolean; // true if modified from default
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

type RolePermissionModel = Model<IRolePermission>;

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: [{ type: String, required: true }],
    isCustom: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const RolePermission = mongoose.model<IRolePermission, RolePermissionModel>(
  'RolePermission',
  RolePermissionSchema,
);

export default RolePermission;
