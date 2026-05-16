import Notification from '../../models/Notification.model.js';

interface NotificationQuery {
  limit?: string;
  page?: string;
}

export class NotificationsService {
  static async getUserNotifications(userId: string, query: NotificationQuery) {
    const limit = parseInt(query.limit || '10');
    const page = parseInt(query.page || '1');
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }

  static async markAsRead(notificationId: string) {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
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