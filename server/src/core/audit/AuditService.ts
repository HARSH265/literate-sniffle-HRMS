import AuditLog from '../../models/AuditLog.model.js';
import { logger } from '../logger/logger.js';

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
  | 'approve' | 'reject' | 'download' | 'view' | 'activate' | 'deactivate';

export interface AuditData {
  action: AuditAction;
  module: string;
  userId: string;
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

export class AuditService {
  static async log(data: AuditData): Promise<void> {
    try {
      await AuditLog.create({
        action: data.action,
        module: data.module,
        userId: data.userId,
        targetId: data.targetId,
        targetName: data.targetName,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        method: data.method,
        path: data.path,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
      });
    } catch (error) {
      logger.error('Audit log failed:', error);
    }
  }

  static async logRequest(data: {
    userId: string;
    action: AuditAction;
    module: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    responseTime?: number;
  }): Promise<void> {
    return this.log(data);
  }
}