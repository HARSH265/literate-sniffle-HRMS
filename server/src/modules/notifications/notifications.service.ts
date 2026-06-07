import Notification from '../../models/Notification.model.js';

interface NotificationQuery {
  limit?: string;
  page?: string;
  module?: string;
  isRead?: string;
}

export class NotificationsService {
  static async getUserNotifications(userId: string, query: NotificationQuery): Promise<{
    notifications: Array<Record<string, unknown>>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const limit = parseInt(query.limit || '10');
    const page = parseInt(query.page || '1');
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { recipient: userId };

    if (query.module) {
      filter.module = query.module;
    }

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1, isRead: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications: notifications.map((n) => ({ ...n, id: n._id.toString() })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate({ _id: notificationId, recipient: userId }, { isRead: true }, { new: true });
  }

  static async markAllAsRead(userId: string) {
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }

  static async createNotification(data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    recipient: string;
    module: string;
    link?: string;
  }) {
    return Notification.create(data);
  }
}