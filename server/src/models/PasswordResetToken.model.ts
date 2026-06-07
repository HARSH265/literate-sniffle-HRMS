import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPasswordResetToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

type PasswordResetTokenModel = Model<IPasswordResetToken>;

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model<IPasswordResetToken, PasswordResetTokenModel>(
  'PasswordResetToken',
  PasswordResetTokenSchema,
);

export default PasswordResetToken;
