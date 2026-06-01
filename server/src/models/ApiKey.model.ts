import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  name: string;
  key: string;
  keyHash: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type ApiKeyModel = Model<IApiKey>;

const ApiKeySchema = new Schema<IApiKey>(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    keyHash: { type: String, required: true },
    prefix: { type: String, required: true },
    permissions: { type: [String], default: ['read'] },
    rateLimit: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

ApiKeySchema.statics.generateKey = function (): { key: string; hash: string; prefix: string } {
  const rawKey = `hrms_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = rawKey.substring(0, 10);
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { key: rawKey, hash, prefix };
};

ApiKeySchema.statics.hashKey = function (key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
};

const ApiKey = mongoose.model<IApiKey, ApiKeyModel>('ApiKey', ApiKeySchema);

export default ApiKey;
