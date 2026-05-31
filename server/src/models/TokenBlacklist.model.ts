import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token: { type: String, required: true, unique: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0s' }, // TTL index: document expires at expiresAt
  },
});

export const TokenBlacklistModel = mongoose.model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);
