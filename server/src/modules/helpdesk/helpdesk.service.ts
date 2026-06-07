import Ticket, { ITicket } from '../../models/Ticket.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { AppError } from '../../core/errors/AppError.js';
import mongoose from 'mongoose';

interface CreateTicketData {
  subject: string;
  description: string;
  category?: 'it' | 'hr' | 'facilities' | 'payroll' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: { url: string; name: string; size: number }[];
}

interface UpdateTicketData {
  subject?: string;
  description?: string;
  category?: 'it' | 'hr' | 'facilities' | 'payroll' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  attachments?: { url: string; name: string; size: number }[];
}

interface AddCommentData {
  message: string;
  attachments?: { url: string; name: string; size: number }[];
}

interface ListOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sort?: string;
  userId?: string;
  assignedTo?: string;
}

async function generateTicketId(): Promise<string> {
  const count = await Ticket.countDocuments();
  const num = String(count + 1).padStart(4, '0');
  return `TKT-${num}`;
}

function calculateSlaDeadline(priority: string, config: any): Date {
  const hoursMap: Record<string, number> = {
    urgent: config.slaHoursUrgent || 4,
    high: config.slaHoursHigh || 8,
    medium: config.slaHoursNormal || 24,
    low: config.slaHoursLow || 72,
  };
  const hours = hoursMap[priority] || 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export const helpdeskService = {
  async create(data: CreateTicketData, userId: string): Promise<ITicket> {
    const settings = await CompanySettings.findOne();
    if (settings?.helpdeskConfig?.ticketsEnabled === false) {
      throw new AppError('Help desk is disabled', 400);
    }

    const ticketId = await generateTicketId();
    const priority = data.priority || 'medium';
    const slaDeadline = calculateSlaDeadline(priority, settings?.helpdeskConfig || {});
    const ticket = await Ticket.create({
      ticketId,
      subject: data.subject,
      description: data.description,
      category: data.category || 'other',
      priority,
      slaDeadline,
      slaBreached: false,
      requestedBy: userId as any,
      comments: [],
      attachments: data.attachments || [],
    });

    await AuditService.log({
      userId: userId as any,
      action: 'create',
      module: 'helpdesk',
      targetId: ticket._id.toString(),
      targetName: ticket.ticketId,
      details: { subject: ticket.subject, category: ticket.category, priority: ticket.priority },
    });

    return ticket;
  },

  async list(options: ListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (options.status) {
      filter.status = options.status;
    }
    if (options.priority) {
      filter.priority = options.priority;
    }
    if (options.category) {
      filter.category = options.category;
    }
    if (options.userId) {
      filter.requestedBy = new mongoose.Types.ObjectId(options.userId);
    }
    if (options.assignedTo) {
      filter.assignedTo = new mongoose.Types.ObjectId(options.assignedTo);
    }
    if (options.search) {
      filter.$or = [
        { subject: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
        { ticketId: { $regex: options.search, $options: 'i' } },
      ];
    }

    const sortOrder: Record<string, 1 | -1> = {};
    if (options.sort === 'oldest') {
      sortOrder.createdAt = 1;
    } else if (options.sort === 'priority') {
      sortOrder.priority = -1;
      sortOrder.createdAt = -1;
    } else {
      sortOrder.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      Ticket.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('requestedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('comments.user', 'name email')
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string): Promise<ITicket | null> {
    return Ticket.findById(id)
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .exec() as Promise<ITicket | null>;
  },

  async update(id: string, data: UpdateTicketData, userId: string): Promise<ITicket | null> {
    const updateData: Record<string, unknown> = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'resolved') updateData.resolvedAt = new Date();
      if (data.status === 'closed') updateData.closedAt = new Date();
      if (['resolved', 'closed'].includes(data.status)) {
        updateData.slaBreached = false;
      }
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo ? new mongoose.Types.ObjectId(data.assignedTo) : null;
    }
    if (data.attachments !== undefined) updateData.attachments = data.attachments;

    const existing = await Ticket.findById(id);
    if (data.priority !== undefined && existing && !['resolved', 'closed'].includes(existing.status)) {
      const settings = await CompanySettings.findOne();
      updateData.slaDeadline = calculateSlaDeadline(data.priority, settings?.helpdeskConfig || {});
      updateData.slaBreached = false;
    }

    const ticket = await Ticket.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .exec();

    if (ticket) {
      await AuditService.log({
        userId: userId as any,
        action: 'update',
        module: 'helpdesk',
        targetId: ticket._id.toString(),
        targetName: ticket.ticketId,
        details: { updatedFields: Object.keys(updateData) },
      });
    }

    return ticket;
  },

  async checkSla(): Promise<number> {
    const now = new Date();
    const result = await Ticket.updateMany(
      {
        status: { $nin: ['resolved', 'closed'] },
        slaDeadline: { $lte: now },
        slaBreached: false,
      },
      { $set: { slaBreached: true } },
    );
    return result.modifiedCount;
  },

  async getStats() {
    const [total, byStatus, byPriority, slaStats] = await Promise.all([
      Ticket.countDocuments({ isActive: true }),
      Ticket.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { isActive: true, status: { $nin: ['resolved', 'closed'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          },
        },
      ]),
    ]);

    const sla = slaStats[0] || { total: 0, breached: 0 };
    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s: any) => [s._id, s.count])),
      byPriority: Object.fromEntries(byPriority.map((p: any) => [p._id, p.count])),
      slaCompliance: sla.total > 0 ? ((sla.total - sla.breached) / sla.total * 100).toFixed(1) : '100.0',
    };
  },

  async addComment(ticketId: string, data: AddCommentData, userId: string): Promise<ITicket | null> {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return null;

    ticket.comments.push({
      user: userId as any,
      message: data.message,
      attachments: data.attachments || [],
      createdAt: new Date(),
    } as any);

    await ticket.save();

    await AuditService.log({
      userId: userId as any,
      action: 'update',
      module: 'helpdesk',
      targetId: ticket._id.toString(),
      targetName: ticket.ticketId,
      details: { action: 'comment_added' },
    });

    return Ticket.findById(ticket._id)
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email')
      .exec() as Promise<ITicket | null>;
  },

  async softDelete(id: string, userId: string): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    ).exec();

    if (ticket) {
      await AuditService.log({
        userId: userId as any,
        action: 'delete',
        module: 'helpdesk',
        targetId: ticket._id.toString(),
        targetName: ticket.ticketId,
      });
    }

    return ticket;
  },
};
