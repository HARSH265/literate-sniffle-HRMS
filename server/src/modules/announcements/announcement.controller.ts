import { Request, Response, NextFunction } from 'express';
import { announcementService } from './announcement.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

export const announcementController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const announcement = await announcementService.create(req.body, userId.toString());
      ResponseHandler.created(res, announcement, 'Announcement created');
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.list({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        priority: req.query.priority as string,
        status: req.query.status as string,
        search: req.query.search as string,
        sort: req.query.sort as string,
      });
      ResponseHandler.paginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.getById(req.params.id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' }); return;
      }
      ResponseHandler.success(res, announcement);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const announcement = await announcementService.update(req.params.id, req.body, userId.toString());
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' }); return;
      }
      ResponseHandler.success(res, announcement, 'Announcement updated');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const announcement = await announcementService.softDelete(req.params.id, userId.toString());
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' }); return;
      }
      ResponseHandler.success(res, null, 'Announcement deleted');
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const announcement = await announcementService.markAsRead(req.params.id, userId.toString());
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' }); return;
      }
      ResponseHandler.success(res, announcement, 'Marked as read');
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await announcementService.getUnreadCount(userId.toString());
      ResponseHandler.success(res, { count });
    } catch (err) {
      next(err);
    }
  },

  async expireOld(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const count = await announcementService.expireOld(userId?.toString());
      ResponseHandler.success(res, { expiredCount: count }, `${count} announcements expired`);
    } catch (err) {
      next(err);
    }
  },

  async processScheduled(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await announcementService.processScheduled();
      ResponseHandler.success(res, { processedCount: count }, `${count} scheduled announcements processed`);
    } catch (err) {
      next(err);
    }
  },
};
