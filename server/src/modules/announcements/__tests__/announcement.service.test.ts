import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Announcement from '../../../models/Announcement.model.js';
import User from '../../../models/User.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import { announcementService } from '../announcement.service.js';

let userId: string;

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({});

  const user = await User.create({
    name: 'Announcement Admin',
    email: 'announce@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Announcement.deleteMany({});
});

describe('announcementService', () => {
  describe('create', () => {
    it('creates an announcement', async () => {
      const result = await announcementService.create(
        { title: 'Test Announcement', content: 'This is a test announcement', priority: 'high' },
        userId,
      );
      expect(result.title).toBe('Test Announcement');
      expect(result.content).toBe('This is a test announcement');
      expect(result.priority).toBe('high');
      expect(result.createdBy.toString()).toBe(userId);
      expect(result.isActive).toBe(true);
    });

    it('throws when announcements are disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'announcementConfig.announcementsEnabled': false } });
      await expect(
        announcementService.create({ title: 'Test', content: 'Content' }, userId),
      ).rejects.toThrow('Announcements are disabled');
      await CompanySettings.updateOne({}, { $set: { 'announcementConfig.announcementsEnabled': true } });
    });

    it('creates with scheduled date', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = await announcementService.create(
        { title: 'Scheduled', content: 'Future announcement', scheduledAt: futureDate },
        userId,
      );
      expect(result.scheduledAt).toBeDefined();
    });
  });

  describe('list', () => {
    it('returns paginated announcements', async () => {
      await Announcement.create([
        { title: 'A1', content: 'C1', createdBy: userId },
        { title: 'A2', content: 'C2', createdBy: userId },
        { title: 'A3', content: 'C3', createdBy: userId },
      ]);

      const result = await announcementService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('filters by priority', async () => {
      await Announcement.create([
        { title: 'Urgent', content: 'C1', priority: 'urgent', createdBy: userId },
        { title: 'Normal', content: 'C2', priority: 'normal', createdBy: userId },
      ]);

      const result = await announcementService.list({ priority: 'urgent' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('Urgent');
    });

    it('filters by active status', async () => {
      await Announcement.create([
        { title: 'Active', content: 'C1', createdBy: userId },
        { title: 'Expired', content: 'C2', expiresAt: new Date(Date.now() - 86400000), createdBy: userId },
      ]);

      const result = await announcementService.list({ status: 'active' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('Active');
    });

    it('searches by title', async () => {
      await Announcement.create([
        { title: 'Holiday Notice', content: 'C1', createdBy: userId },
        { title: 'Meeting Reminder', content: 'C2', createdBy: userId },
      ]);

      const result = await announcementService.list({ search: 'Holiday' });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns announcement by id', async () => {
      const created = await announcementService.create(
        { title: 'Get Test', content: 'Content' },
        userId,
      );
      const result = await announcementService.getById(created._id.toString());
      expect(result).toBeDefined();
      expect(result!.title).toBe('Get Test');
    });

    it('returns null for non-existent id', async () => {
      const result = await announcementService.getById(new mongoose.Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates announcement fields', async () => {
      const created = await announcementService.create(
        { title: 'Original', content: 'Original content' },
        userId,
      );
      const updated = await announcementService.update(
        created._id.toString(),
        { title: 'Updated Title', priority: 'urgent' },
        userId,
      );
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.priority).toBe('urgent');
    });

    it('returns null for non-existent id', async () => {
      const result = await announcementService.update(
        new mongoose.Types.ObjectId().toString(),
        { title: 'Nope' },
        userId,
      );
      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets isActive to false', async () => {
      const created = await announcementService.create(
        { title: 'To Delete', content: 'Content' },
        userId,
      );
      const deleted = await announcementService.softDelete(created._id.toString(), userId);
      expect(deleted!.isActive).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('marks announcement as read', async () => {
      const created = await announcementService.create(
        { title: 'Read Test', content: 'Content' },
        userId,
      );
      const result = await announcementService.markAsRead(created._id.toString(), userId);
      expect(result!.readBy.length).toBe(1);
      expect(result!.readBy[0].user.toString()).toBe(userId);
    });

    it('does not duplicate read marks', async () => {
      const created = await announcementService.create(
        { title: 'Dedup', content: 'Content' },
        userId,
      );
      await announcementService.markAsRead(created._id.toString(), userId);
      const result = await announcementService.markAsRead(created._id.toString(), userId);
      expect(result!.readBy.length).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('returns correct unread count', async () => {
      await announcementService.create({ title: 'Unread 1', content: 'C1' }, userId);
      await announcementService.create({ title: 'Unread 2', content: 'C2' }, userId);

      const count = await announcementService.getUnreadCount(userId);
      expect(count).toBe(2);
    });

    it('excludes read announcements', async () => {
      const a = await announcementService.create({ title: 'Read', content: 'C1' }, userId);
      await announcementService.markAsRead(a._id.toString(), userId);

      const count = await announcementService.getUnreadCount(userId);
      expect(count).toBe(0);
    });
  });

  describe('expireOld', () => {
    it('expires old announcements', async () => {
      await Announcement.create([
        { title: 'Old', content: 'C1', expiresAt: new Date(Date.now() - 86400000), isActive: true, createdBy: userId },
        { title: 'Current', content: 'C2', isActive: true, createdBy: userId },
      ]);

      const count = await announcementService.expireOld();
      expect(count).toBe(1);
    });
  });
});
