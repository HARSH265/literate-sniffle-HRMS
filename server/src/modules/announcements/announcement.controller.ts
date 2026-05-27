import { Request, Response, NextFunction } from 'express';
import { announcementService } from './announcement.service.js';

export const announcementController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const announcement = await announcementService.create(req.body, userId.toString());
      res.status(201).json({ success: true, data: announcement, message: 'Announcement created' });
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
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.getById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      res.json({ success: true, data: announcement });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const announcement = await announcementService.update(req.params.id, req.body, userId.toString());
      if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      res.json({ success: true, data: announcement, message: 'Announcement updated' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const announcement = await announcementService.softDelete(req.params.id, userId.toString());
      if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      res.json({ success: true, message: 'Announcement deleted' });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const announcement = await announcementService.markAsRead(req.params.id, userId.toString());
      if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      res.json({ success: true, data: announcement, message: 'Marked as read' });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const count = await announcementService.getUnreadCount(userId.toString());
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async expireOld(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id;
      const count = await announcementService.expireOld(userId?.toString());
      res.json({ success: true, data: { expiredCount: count }, message: `${count} announcements expired` });
    } catch (err) {
      next(err);
    }
  },

  async processScheduled(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await announcementService.processScheduled();
      res.json({ success: true, data: { processedCount: count }, message: `${count} scheduled announcements processed` });
    } catch (err) {
      next(err);
    }
  },
};
