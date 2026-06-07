import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Ticket from '../../../models/Ticket.model.js';
import User from '../../../models/User.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import { helpdeskService } from '../helpdesk.service.js';

let userId: string;

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({
    helpdeskConfig: { ticketsEnabled: true, autoAssign: false, maxAttachments: 5, slaHoursUrgent: 4, slaHoursHigh: 8, slaHoursNormal: 24, slaHoursLow: 72 },
  });

  const user = await User.create({
    name: 'Helpdesk User',
    email: 'helpdesk@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Ticket.deleteMany({});
});

describe('helpdeskService', () => {
  describe('create', () => {
    it('creates a ticket', async () => {
      const result = await helpdeskService.create(
        { subject: 'Keyboard not working', description: 'My keyboard is broken', priority: 'high', category: 'it' },
        userId,
      );
      expect(result.subject).toBe('Keyboard not working');
      expect(result.description).toBe('My keyboard is broken');
      expect(result.priority).toBe('high');
      expect(result.category).toBe('it');
      expect(result.requestedBy.toString()).toBe(userId);
      expect(result.status).toBe('open');
      expect(result.ticketId).toMatch(/^TKT-\d{4}$/);
    });

    it('throws when help desk is disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'helpdeskConfig.ticketsEnabled': false } });
      await expect(
        helpdeskService.create({ subject: 'Test', description: 'Content' }, userId),
      ).rejects.toThrow('Help desk is disabled');
      await CompanySettings.updateOne({}, { $set: { 'helpdeskConfig.ticketsEnabled': true } });
    });

    it('sets default values and slaDeadline', async () => {
      const result = await helpdeskService.create(
        { subject: 'Test ticket', description: 'Just a test' },
        userId,
      );
      expect(result.priority).toBe('medium');
      expect(result.category).toBe('other');
      expect(result.status).toBe('open');
      expect(result.slaDeadline).toBeDefined();
      expect(result.slaBreached).toBe(false);
      expect(new Date(result.slaDeadline!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('list', () => {
    it('returns paginated tickets', async () => {
      await Ticket.create([
        { ticketId: 'TKT-0001', subject: 'T1', description: 'D1', requestedBy: userId },
        { ticketId: 'TKT-0002', subject: 'T2', description: 'D2', requestedBy: userId },
        { ticketId: 'TKT-0003', subject: 'T3', description: 'D3', requestedBy: userId },
      ]);

      const result = await helpdeskService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('filters by status', async () => {
      await Ticket.create([
        { ticketId: 'TKT-0010', subject: 'Open', description: 'D1', status: 'open', requestedBy: userId },
        { ticketId: 'TKT-0011', subject: 'Resolved', description: 'D2', status: 'resolved', requestedBy: userId },
      ]);

      const result = await helpdeskService.list({ status: 'open' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].subject).toBe('Open');
    });

    it('filters by priority', async () => {
      await Ticket.create([
        { ticketId: 'TKT-0020', subject: 'Urgent', description: 'D1', priority: 'urgent', requestedBy: userId },
        { ticketId: 'TKT-0021', subject: 'Low', description: 'D2', priority: 'low', requestedBy: userId },
      ]);

      const result = await helpdeskService.list({ priority: 'urgent' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].subject).toBe('Urgent');
    });

    it('filters by category', async () => {
      await Ticket.create([
        { ticketId: 'TKT-0030', subject: 'IT issue', description: 'D1', category: 'it', requestedBy: userId },
        { ticketId: 'TKT-0031', subject: 'HR issue', description: 'D2', category: 'hr', requestedBy: userId },
      ]);

      const result = await helpdeskService.list({ category: 'hr' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].subject).toBe('HR issue');
    });

    it('searches by subject', async () => {
      await Ticket.create([
        { ticketId: 'TKT-0040', subject: 'Network down', description: 'D1', requestedBy: userId },
        { ticketId: 'TKT-0041', subject: 'Printer jam', description: 'D2', requestedBy: userId },
      ]);

      const result = await helpdeskService.list({ search: 'Network' });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns ticket by id', async () => {
      const created = await helpdeskService.create(
        { subject: 'Get Test', description: 'Content' },
        userId,
      );
      const result = await helpdeskService.getById(created._id.toString());
      expect(result).toBeDefined();
      expect(result!.subject).toBe('Get Test');
    });

    it('returns null for non-existent id', async () => {
      const result = await helpdeskService.getById(new mongoose.Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates ticket fields', async () => {
      const created = await helpdeskService.create(
        { subject: 'Original', description: 'Original description' },
        userId,
      );
      const updated = await helpdeskService.update(
        created._id.toString(),
        { subject: 'Updated Subject', priority: 'urgent' },
        userId,
      );
      expect(updated!.subject).toBe('Updated Subject');
      expect(updated!.priority).toBe('urgent');
    });

    it('sets resolvedAt when status is resolved', async () => {
      const created = await helpdeskService.create(
        { subject: 'Resolve me', description: 'Content' },
        userId,
      );
      const updated = await helpdeskService.update(
        created._id.toString(),
        { status: 'resolved' },
        userId,
      );
      expect(updated!.status).toBe('resolved');
      expect(updated!.resolvedAt).toBeDefined();
    });

    it('sets closedAt when status is closed', async () => {
      const created = await helpdeskService.create(
        { subject: 'Close me', description: 'Content' },
        userId,
      );
      const updated = await helpdeskService.update(
        created._id.toString(),
        { status: 'closed' },
        userId,
      );
      expect(updated!.status).toBe('closed');
      expect(updated!.closedAt).toBeDefined();
    });

    it('returns null for non-existent id', async () => {
      const result = await helpdeskService.update(
        new mongoose.Types.ObjectId().toString(),
        { subject: 'Nope' },
        userId,
      );
      expect(result).toBeNull();
    });
  });

  describe('addComment', () => {
    it('adds a comment to a ticket', async () => {
      const created = await helpdeskService.create(
        { subject: 'Comment test', description: 'Content' },
        userId,
      );
      const result = await helpdeskService.addComment(
        created._id.toString(),
        { message: 'Working on it' },
        userId,
      );
      expect(result!.comments.length).toBe(1);
      expect(result!.comments[0].message).toBe('Working on it');
      const commentUser = result!.comments[0].user;
      const commentUserId = typeof commentUser === 'object' ? (commentUser as any)._id?.toString() : commentUser.toString();
      expect(commentUserId).toBe(userId);
    });

    it('returns null for non-existent ticket', async () => {
      const result = await helpdeskService.addComment(
        new mongoose.Types.ObjectId().toString(),
        { message: 'Hello' },
        userId,
      );
      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets isActive to false', async () => {
      const created = await helpdeskService.create(
        { subject: 'To Delete', description: 'Content' },
        userId,
      );
      const deleted = await helpdeskService.softDelete(created._id.toString(), userId);
      expect(deleted!.isActive).toBe(false);
    });
  });

  describe('SLA', () => {
    it('calculates slaDeadline based on priority', async () => {
      const urgent = await helpdeskService.create(
        { subject: 'Urgent', description: 'U', priority: 'urgent' },
        userId,
      );
      const low = await helpdeskService.create(
        { subject: 'Low', description: 'L', priority: 'low' },
        userId,
      );
      const urgentDeadline = new Date(urgent.slaDeadline!).getTime();
      const lowDeadline = new Date(low.slaDeadline!).getTime();
      expect(urgentDeadline).toBeLessThan(lowDeadline);
    });

    it('clears slaBreached when status changes to resolved', async () => {
      const ticket = await helpdeskService.create(
        { subject: 'SLA test', description: 'Content', priority: 'urgent' },
        userId,
      );
      await Ticket.findByIdAndUpdate(ticket._id, { $set: { slaBreached: true } });
      const updated = await helpdeskService.update(
        ticket._id.toString(),
        { status: 'resolved' },
        userId,
      );
      expect(updated!.slaBreached).toBe(false);
    });

    it('checkSla marks overdue tickets as breached', async () => {
      const ticket = await helpdeskService.create(
        { subject: 'Overdue', description: 'Content', priority: 'urgent' },
        userId,
      );
      await Ticket.findByIdAndUpdate(ticket._id, {
        $set: { slaDeadline: new Date(Date.now() - 3600000) },
      });
      const breached = await helpdeskService.checkSla();
      expect(breached).toBe(1);
      const found = await Ticket.findById(ticket._id);
      expect(found!.slaBreached).toBe(true);
    });

    it('checkSla skips resolved and closed tickets', async () => {
      const resolved = await helpdeskService.create(
        { subject: 'Resolved', description: 'Content' },
        userId,
      );
      await Ticket.findByIdAndUpdate(resolved._id, {
        $set: { status: 'resolved', slaDeadline: new Date(Date.now() - 3600000) },
      });
      const breached = await helpdeskService.checkSla();
      expect(breached).toBe(0);
    });

    it('getStats returns SLA compliance', async () => {
      await Ticket.deleteMany({});
      await helpdeskService.create({ subject: 'A', description: 'A' }, userId);
      await helpdeskService.create({ subject: 'B', description: 'B' }, userId);
      const all = await Ticket.find();
      await Ticket.findByIdAndUpdate(all[0]._id, {
        $set: { slaDeadline: new Date(Date.now() - 3600000) },
      });
      await helpdeskService.checkSla();
      const stats = await helpdeskService.getStats();
      expect(stats.total).toBe(2);
      expect(Number(stats.slaCompliance)).toBe(50);
    });
  });
});
