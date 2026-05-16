import AuditLog from '../../models/AuditLog.model.js';
import { logger } from '../logger/logger.js';

export type AuditAction = 'create' | 'update' | 'delete' | 'finalize' | 'login' | 'logout';

export interface AuditData {
  action: AuditAction;
  module: string;
  userId: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(data: AuditData): Promise<void> {
    try {
      await AuditLog.create({
        action: data.action,
        module: data.module,
        userId: data.userId,
        targetId: data.targetId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      logger.error('Audit log failed:', error);
    }
  }
}