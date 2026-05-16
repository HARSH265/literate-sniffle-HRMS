import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLES } from '../config/constants.js';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: (typeof ROLES)[keyof typeof ROLES];
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface UserModel extends Model<IUser> {}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
      default: ROLES.HR_STAFF,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;