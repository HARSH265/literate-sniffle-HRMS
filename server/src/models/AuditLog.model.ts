import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'archive' | 'finalize' | 'unfinalize'
  | 'login' | 'logout' | 'logout-all-devices' | 'upload-logo' | 'test-email'
  | 'import' | 'export' | 'mark-read' | 'mark-all-read'
  | 'bulk-create' | 'bulk-update'
  | 'change-password' | 'reset-password' | 'update-settings'
  | 'add-shift' | 'edit-shift' | 'delete-shift'
  | 'add-designation' | 'edit-designation' | 'delete-designation'
  | 'add-department' | 'edit-department' | 'delete-department'
  | 'add-holiday' | 'edit-holiday' | 'delete-holiday'
  | 'add-rule' | 'edit-rule' | 'delete-rule'
  | 'approve' | 'reject' | 'download' | 'view'
  | 'attendance-checkin' | 'attendance-checkout'
  | 'kiosk-register'
  | 'totp-enroll' | 'totp-disable';

export interface IAuditLog extends Document {
  action: AuditAction;
  module: string;
  userId: mongoose.Types.ObjectId;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
}

type AuditLogModel = Model<IAuditLog>;

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    module: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: String },
    targetName: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
    responseTime: { type: Number },
  },
  { timestamps: true },
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: 1 });
AuditLogSchema.index({ targetId: 1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1 });

const AuditLog = mongoose.model<IAuditLog, AuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;