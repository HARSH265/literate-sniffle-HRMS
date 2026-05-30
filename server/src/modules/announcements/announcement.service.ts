import Announcement, { IAnnouncement } from '../../models/Announcement.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import User from '../../models/User.model.js';
import Employee from '../../models/Employee.model.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { NotificationsService } from '../notifications/notifications.service.js';

interface CreateAnnouncementData {
  title: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience?: 'all' | 'department' | 'designation' | 'specificEmployees';
  targetIds?: string[];
  attachments?: { url: string; name: string; size: number }[];
  scheduledAt?: string;
  expiresAt?: string;
}

interface ListOptions {
  page?: number;
  limit?: number;
  priority?: string;
  status?: string;
  search?: string;
  sort?: string;
}

async function resolveRecipients(announcement: IAnnouncement): Promise<string[]> {
  const { targetAudience, targetIds } = announcement;
  const ids = (targetIds || []).map((id) => id.toString());

  if (targetAudience === 'all') {
    const users = await User.find({ employeeId: { $exists: true, $ne: null } }, { _id: 1 }).lean();
    return users.map((u) => u._id.toString());
  }

  if (targetAudience === 'specificEmployees') {
    const users = await User.find({ employeeId: { $in: ids } }, { _id: 1 }).lean();
    return users.map((u) => u._id.toString());
  }

  if (targetAudience === 'department' || targetAudience === 'designation') {
    const field = targetAudience === 'department' ? 'department' : 'designation';
    const employees = await Employee.find({ [field]: { $in: ids } }, { _id: 1 }).lean();
    const employeeIds = employees.map((e) => e._id.toString());
    const users = await User.find({ employeeId: { $in: employeeIds } }, { _id: 1 }).lean();
    return users.map((u) => u._id.toString());
  }

  return [];
}

async function sendNotifications(announcement: IAnnouncement): Promise<void> {
  const recipientIds = await resolveRecipients(announcement);
  if (recipientIds.length === 0) return;

  const type = announcement.priority === 'urgent' ? 'warning'
    : announcement.priority === 'high' ? 'warning'
    : 'info';

  const notifications = recipientIds.map((userId) =>
    NotificationsService.createNotification({
      title: `Announcement: ${announcement.title}`,
      message: announcement.content.substring(0, 200),
      type,
      recipient: userId,
      module: 'announcements',
      link: `/announcements/${announcement._id}`,
    }),
  );

  await Promise.all(notifications);
  await Announcement.findByIdAndUpdate(announcement._id, { notificationsSent: true });
}

export const announcementService = {
  async create(data: CreateAnnouncementData, userId: string): Promise<IAnnouncement> {
    const settings = await CompanySettings.findOne();
    if (settings?.announcementConfig?.announcementsEnabled === false) {
      throw new Error('Announcements are disabled');
    }

    const announcement = await Announcement.create({
      title: data.title,
      content: data.content,
      priority: data.priority || 'normal',
      targetAudience: data.targetAudience || 'all',
      targetIds: data.targetIds?.map((id) => id as any) || [],
      attachments: data.attachments || [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      createdBy: userId as any,
      readBy: [],
      isActive: true,
    });

    await AuditService.log({
      userId: userId as any,
      action: 'create',
      module: 'announcements',
      targetId: announcement._id.toString(),
      targetName: announcement.title,
      details: { priority: announcement.priority, targetAudience: announcement.targetAudience },
    });

    if (!announcement.scheduledAt || announcement.scheduledAt <= new Date()) {
      await sendNotifications(announcement).catch((err) =>
        console.error('Failed to send announcement notifications:', err),
      );
    }

    return announcement;
  },

  async list(options: ListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (options.priority) {
      filter.priority = options.priority;
    }

    if (options.status === 'active') {
      filter.isActive = true;
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ];
    } else if (options.status === 'expired') {
      filter.isActive = true;
      filter.expiresAt = { $lte: new Date() };
    } else if (options.status === 'inactive') {
      filter.isActive = false;
    }

    if (options.search) {
      const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } },
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
      Announcement.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string): Promise<IAnnouncement | null> {
    return Announcement.findById(id)
      .populate('createdBy', 'name email')
      .populate('readBy.user', 'name email')
      .exec() as Promise<IAnnouncement | null>;
  },

  async update(id: string, data: Partial<CreateAnnouncementData>, userId: string): Promise<IAnnouncement | null> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;
    if (data.targetIds !== undefined) updateData.targetIds = data.targetIds.map((id) => id as any);
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);

    const announcement = await Announcement.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('createdBy', 'name email')
      .exec();

    if (announcement) {
      await AuditService.log({
        userId: userId as any,
        action: 'update',
        module: 'announcements',
        targetId: announcement._id.toString(),
        targetName: announcement.title,
        details: { updatedFields: Object.keys(updateData) },
      });
    }

    return announcement;
  },

  async softDelete(id: string, userId: string): Promise<IAnnouncement | null> {
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    ).exec();

    if (announcement) {
      await AuditService.log({
        userId: userId as any,
        action: 'delete',
        module: 'announcements',
        targetId: announcement._id.toString(),
        targetName: announcement.title,
      });
    }

    return announcement;
  },

  async markAsRead(announcementId: string, userId: string): Promise<IAnnouncement | null> {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) return null;

    const alreadyRead = announcement.readBy.some(
      (r) => r.user.toString() === userId,
    );

    if (!alreadyRead) {
      announcement.readBy.push({ user: userId as any, readAt: new Date() });
      await announcement.save();
    }

    return announcement;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const count = await Announcement.countDocuments({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
      'readBy.user': { $ne: userId as any },
    });
    return count;
  },

  async processScheduled(): Promise<number> {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      notificationsSent: false,
      scheduledAt: { $exists: true, $ne: null, $lte: now },
    });

    let sentCount = 0;
    for (const announcement of announcements) {
      await sendNotifications(announcement).catch((err) =>
        console.error(`Failed to send notifications for announcement ${announcement._id}:`, err),
      );
      sentCount++;
    }
    return sentCount;
  },

  async expireOld(userId?: string): Promise<number> {
    const result = await Announcement.updateMany(
      {
        isActive: true,
        expiresAt: { $exists: true, $ne: null, $lte: new Date() },
      },
      { $set: { isActive: false } },
    );

    if (result.modifiedCount > 0 && userId) {
      await AuditService.log({
        userId: userId as any,
        action: 'update',
        module: 'announcements',
        targetId: 'bulk-expire',
        targetName: 'Auto-expire old announcements',
        details: { count: result.modifiedCount },
      });
    }

    return result.modifiedCount;
  },
};
