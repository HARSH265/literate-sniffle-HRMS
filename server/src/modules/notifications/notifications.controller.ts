import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const notifications = await NotificationsService.getUserNotifications(userId, req.query);
  const meta = {
    page: notifications.pagination.page,
    limit: notifications.pagination.limit,
    total: notifications.pagination.total,
    totalPages: notifications.pagination.pages,
  };
  ResponseHandler.paginated(res, notifications.notifications, meta, 'Notifications fetched successfully');
});

const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const count = await NotificationsService.getUnreadCount(userId);
  ResponseHandler.success(res, { count }, 'Unread count fetched successfully');
});

const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const notification = await NotificationsService.markAsRead(req.params.id, userId);
  ResponseHandler.success(res, notification, 'Notification marked as read');
});

const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  await NotificationsService.markAllAsRead(userId);
  ResponseHandler.success(res, null, 'All notifications marked as read');
});

export const notificationsController = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};