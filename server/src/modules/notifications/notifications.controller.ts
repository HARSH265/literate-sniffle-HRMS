import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const notifications = await NotificationsService.getUserNotifications(userId, req.query);
  res.json({ success: true, data: notifications });
});

const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const count = await NotificationsService.getUnreadCount(userId);
  res.json({ success: true, data: { count } });
});

const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const notification = await NotificationsService.markAsRead(req.params.id, userId);
  res.json({ success: true, data: notification });
});

const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  await NotificationsService.markAllAsRead(userId);
  res.json({ success: true, message: 'All notifications marked as read' });
});

export const notificationsController = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};