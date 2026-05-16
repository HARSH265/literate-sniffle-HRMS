import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: 'create' | 'update' | 'delete' | 'finalize' | 'login' | 'logout';
  module: string;
  userId: mongoose.Types.ObjectId;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogModel extends Model<IAuditLog> {}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'finalize', 'login', 'logout'],
    },
    module: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ createdAt: 1 });

const AuditLog = mongoose.model<IAuditLog, AuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;