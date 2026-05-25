import Notification from '../../models/Notification.model.js';
import User from '../../models/User.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { logger } from '../logger/logger.js';
import { EmailService } from '../email/EmailService.js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  recipient: string;
  module: string;
  link?: string;
}

export class NotificationService {
  static async send(data: NotificationData): Promise<void> {
    try {
      await Notification.create({
        title: data.title,
        message: data.message,
        type: data.type,
        recipient: data.recipient,
        module: data.module,
        link: data.link,
      });

      await this.sendEmailIfEnabled(data);
    } catch (error) {
      logger.error('Notification send failed:', error);
    }
  }

  private static async sendEmailIfEnabled(data: NotificationData): Promise<void> {
    try {
      const settings = await CompanySettings.findOne().lean();
      const notifConfig = (settings as any)?.notificationConfig;

      if (!notifConfig?.emailEnabled) return;

      const recipientUser = await User.findById(data.recipient).lean();
      if (!recipientUser?.email) return;

      let shouldEmail = false;
      switch (data.module) {
        case 'payroll':
          shouldEmail = notifConfig.notifyOnPayrollRun !== false;
          break;
        case 'employees':
          shouldEmail = notifConfig.notifyOnEmployeeAdded !== false;
          break;
        case 'users':
          shouldEmail = notifConfig.notifyOnUserCreated !== false;
          break;
        case 'attendance':
          shouldEmail = notifConfig.notifyOnAttendanceEntry === true;
          break;
        case 'leave':
          shouldEmail = notifConfig.notifyOnLeaveApplied === true;
          break;
        case 'leave-approval':
          shouldEmail = notifConfig.notifyOnLeaveApproved === true;
          break;
      }

      if (!shouldEmail) return;

      await EmailService.send(
        recipientUser.email,
        data.title,
        `<h2>${data.title}</h2><p>${data.message}</p>`,
      );
    } catch (error) {
      logger.error('Email notification failed:', error);
    }
  }

  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.updateOne(
        { _id: notificationId, recipient: userId },
        { isRead: true },
      );
    } catch (error) {
      logger.error('Mark notification as read failed:', error);
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany({ recipient: userId }, { isRead: true });
    } catch (error) {
      logger.error('Mark all notifications as read failed:', error);
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ recipient: userId, isRead: false });
    } catch (error) {
      logger.error('Get unread notification count failed:', error);
      return 0;
    }
  }
}