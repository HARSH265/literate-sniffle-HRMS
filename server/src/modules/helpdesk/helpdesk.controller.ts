import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { helpdeskService } from './helpdesk.service.js';

export const helpdeskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const ticket = await helpdeskService.create(req.body, userId.toString());
      ResponseHandler.created(res, ticket, 'Ticket created');
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await helpdeskService.list({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        status: req.query.status as string,
        priority: req.query.priority as string,
        category: req.query.category as string,
        search: req.query.search as string,
        sort: req.query.sort as string,
        userId: req.query.userId as string,
        assignedTo: req.query.assignedTo as string,
      });
      ResponseHandler.paginated(res, result.data, result.meta, 'Helpdesk tickets fetched');
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await helpdeskService.getById(req.params.id);
      if (!ticket) {
        ResponseHandler.error(res, 'Ticket not found', 404); return;
      }
      ResponseHandler.success(res, ticket, 'Ticket fetched');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const ticket = await helpdeskService.update(req.params.id, req.body, userId.toString());
      if (!ticket) {
        ResponseHandler.error(res, 'Ticket not found', 404); return;
      }
      ResponseHandler.success(res, ticket, 'Ticket updated');
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const ticket = await helpdeskService.addComment(req.params.id, req.body, userId.toString());
      if (!ticket) {
        ResponseHandler.error(res, 'Ticket not found', 404); return;
      }
      ResponseHandler.created(res, ticket, 'Comment added');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const ticket = await helpdeskService.softDelete(req.params.id, userId.toString());
      if (!ticket) {
        ResponseHandler.error(res, 'Ticket not found', 404); return;
      }
      ResponseHandler.success(res, null, 'Ticket deleted');
    } catch (err) {
      next(err);
    }
  },

  async checkSla(_req: Request, res: Response, next: NextFunction) {
    try {
      const breached = await helpdeskService.checkSla();
      ResponseHandler.success(res, { breached }, 'SLA check completed');
    } catch (err) {
      next(err);
    }
  },

  async stats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await helpdeskService.getStats();
      ResponseHandler.success(res, stats, 'Helpdesk stats fetched');
    } catch (err) {
      next(err);
    }
  },
};
