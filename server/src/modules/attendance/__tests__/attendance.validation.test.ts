import { describe, it, expect } from 'vitest';
import {
  createAttendanceEntrySchema,
  bulkAttendanceSchema,
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
});
