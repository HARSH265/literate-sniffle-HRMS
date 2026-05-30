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
  updatedBy?: mongoose.Types.ObjectId;
  failedLoginAttempts?: number;
  lockUntil?: Date;
  refreshToken?: string;
  passwordHistory?: string[];
  employeeId?: mongoose.Types.ObjectId;
  preferredLanguage?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordInHistory(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser>;

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
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String, index: true },
    passwordHistory: { type: [String], default: [] },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    preferredLanguage: { type: String, default: 'en' },
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

UserSchema.methods.isPasswordInHistory = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }
  
  for (const oldPassword of this.passwordHistory) {
    if (await bcrypt.compare(candidatePassword, oldPassword)) {
      return true;
    }
  }
  return false;
};

const User = mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;