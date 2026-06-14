import { describe, it, expect } from 'vitest';
import {
  createAttendanceEntrySchema,
  updateAttendanceEntrySchema,
  idParamSchema,
  listAttendanceQuerySchema,
  monthlyViewQuerySchema,
  adminCheckoutBodySchema,
  bulkAttendanceSchema,
  bulkUpdateAttendanceSchema,
} from '../attendance.validation.js';

describe('attendance validation schemas', () => {
  describe('createAttendanceEntrySchema', () => {
    const validPayload = {
      employee: '507f1f77bcf86cd799439011',
      date: '2025-03-15',
      status: 'present' as const,
      inTime: '09:00',
      outTime: '18:00',
    };

    it('accepts valid payload', () => {
      const result = createAttendanceEntrySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects missing employee', () => {
      const { employee, ...rest } = validPayload;
      void employee;
      const result = createAttendanceEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, date: '15-03-2025' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('accepts all valid statuses', () => {
      for (const status of ['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']) {
        const result = createAttendanceEntrySchema.safeParse({ ...validPayload, status });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid time format', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, inTime: '9:00' });
      expect(result.success).toBe(false);
    });

    it('accepts optional remarks', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, remarks: 'Came late' });
      expect(result.success).toBe(true);
    });

    it('rejects long remarks', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, remarks: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('rejects overtime exceeding 24 hours', () => {
      const result = createAttendanceEntrySchema.safeParse({ ...validPayload, overtimeHours: 25 });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkAttendanceSchema', () => {
    const validPayload = {
      date: '2025-03-15',
      entries: [
        { employee: '507f1f77bcf86cd799439011', status: 'present' as const },
        { employee: '507f1f77bcf86cd799439012', status: 'absent' as const },
      ],
    };

    it('accepts valid bulk payload', () => {
      const result = bulkAttendanceSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects empty entries array', () => {
      const result = bulkAttendanceSchema.safeParse({ ...validPayload, entries: [] });
      expect(result.success).toBe(false);
    });

    it('rejects more than 500 entries', () => {
      const result = bulkAttendanceSchema.safeParse({
        date: '2025-03-15',
        entries: Array(501).fill({ employee: '507f1f77bcf86cd799439011', status: 'present' }),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date in bulk', () => {
      const result = bulkAttendanceSchema.safeParse({ date: 'invalid', entries: validPayload.entries });
      expect(result.success).toBe(false);
    });

    it('rejects entry with invalid status in bulk', () => {
      const result = bulkAttendanceSchema.safeParse({
        date: '2025-03-15',
        entries: [{ employee: '507f1f77bcf86cd799439011', status: 'unknown' }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts entries with optional times', () => {
      const result = bulkAttendanceSchema.safeParse({
        date: '2025-03-15',
        entries: [
          { employee: '507f1f77bcf86cd799439011', status: 'present', inTime: '09:00', outTime: '18:00' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateAttendanceEntrySchema', () => {
    it('accepts valid partial update', () => {
      const result = updateAttendanceEntrySchema.safeParse({ status: 'absent' });
      expect(result.success).toBe(true);
    });

    it('accepts full update payload', () => {
      const result = updateAttendanceEntrySchema.safeParse({
        employee: '507f1f77bcf86cd799439011',
        date: '2025-03-15',
        status: 'present',
        inTime: '09:00',
        outTime: '18:00',
        remarks: 'Updated',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = updateAttendanceEntrySchema.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid time format', () => {
      const result = updateAttendanceEntrySchema.safeParse({ inTime: '9:00' });
      expect(result.success).toBe(false);
    });

    it('rejects long remarks', () => {
      const result = updateAttendanceEntrySchema.safeParse({ remarks: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('accepts valid ObjectId', () => {
      const result = idParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid ObjectId', () => {
      const result = idParamSchema.safeParse({ id: 'invalid-id' });
      expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
      const result = idParamSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('listAttendanceQuerySchema', () => {
    it('accepts empty query', () => {
      const result = listAttendanceQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts valid filters', () => {
      const result = listAttendanceQuerySchema.safeParse({
        status: 'present',
        department: '507f1f77bcf86cd799439011',
        page: '1',
        limit: '20',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = listAttendanceQuerySchema.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('rejects page less than 1', () => {
      const result = listAttendanceQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('rejects limit over 100', () => {
      const result = listAttendanceQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });

  describe('monthlyViewQuerySchema', () => {
    it('accepts valid month and year', () => {
      const result = monthlyViewQuerySchema.safeParse({ month: '3', year: '2025' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid month', () => {
      const result = monthlyViewQuerySchema.safeParse({ month: '13', year: '2025' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid year', () => {
      const result = monthlyViewQuerySchema.safeParse({ month: '3', year: '1999' });
      expect(result.success).toBe(false);
    });

    it('accepts optional department and pagination', () => {
      const result = monthlyViewQuerySchema.safeParse({
        month: '3', year: '2025',
        department: '507f1f77bcf86cd799439011',
        page: '2', limit: '50',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('adminCheckoutBodySchema', () => {
    it('accepts valid reason', () => {
      const result = adminCheckoutBodySchema.safeParse({ reason: 'Emergency' });
      expect(result.success).toBe(true);
    });

    it('rejects empty reason', () => {
      const result = adminCheckoutBodySchema.safeParse({ reason: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing reason', () => {
      const result = adminCheckoutBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateAttendanceSchema', () => {
    it('accepts valid payload', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({
        entries: [
          { id: '507f1f77bcf86cd799439011', status: 'present' },
          { id: '507f1f77bcf86cd799439012', status: 'absent' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty entries', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({ entries: [] });
      expect(result.success).toBe(false);
    });

    it('rejects more than 100 entries', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({
        entries: Array(101).fill({ id: '507f1f77bcf86cd799439011', status: 'present' }),
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing entry id', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({
        entries: [{ status: 'present' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status in entry', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({
        entries: [{ id: '507f1f77bcf86cd799439011', status: 'unknown' }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts entries with optional fields', () => {
      const result = bulkUpdateAttendanceSchema.safeParse({
        entries: [
          { id: '507f1f77bcf86cd799439011', status: 'present', inTime: '09:00', outTime: '18:00', remarks: 'On time' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});
