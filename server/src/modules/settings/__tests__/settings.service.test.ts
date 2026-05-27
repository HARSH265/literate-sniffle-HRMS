import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import CompanySettings from '../../../models/CompanySettings.model.js';
import User from '../../../models/User.model.js';
import { SettingsService } from '../settings.service.js';

let userId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'settings@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await CompanySettings.deleteMany({});
});

describe('SettingsService', () => {
  describe('get', () => {
    it('returns existing settings', async () => {
      await CompanySettings.create({ companyInfo: { name: 'Test Corp' } });
      const result = await SettingsService.get() as any;
      expect(result.companyInfo.name).toBe('Test Corp');
    });

    it('returns settings with defaults', async () => {
      const created = await CompanySettings.create({});
      const plain = created.toObject();
      expect(plain.companyInfo.name).toBe('My Company');
    });
  });

  describe('update', () => {
    it('updates company info', async () => {
      await CompanySettings.create({});
      const result = await SettingsService.update({ companyInfo: { name: 'Orian Corp' } }, userId) as any;
      expect(result.companyInfo.name).toBe('Orian Corp');
    });

    it('updates payroll config', async () => {
      await CompanySettings.create({});
      const result = await SettingsService.update({ payrollConfig: { defaultWorkingDays: 24 } }, userId) as any;
      expect(result.payrollConfig.defaultWorkingDays).toBe(24);
    });

    it('creates settings on the fly if none exist', async () => {
      const result = await SettingsService.update({ companyInfo: { name: 'New Co' } }, userId) as any;
      expect(result.companyInfo.name).toBe('New Co');
    });

    it('updates attendance config', async () => {
      await CompanySettings.create({});
      const result = await SettingsService.update({ attendanceConfig: { gracePeriodMinutes: 10 } }, userId) as any;
      expect(result.attendanceConfig.gracePeriodMinutes).toBe(10);
    });

    it('updates email config', async () => {
      await CompanySettings.create({});
      const result = await SettingsService.update({ emailConfig: { host: 'smtp.test.com', fromEmail: 'hr@test.com' } }, userId) as any;
      expect(result.emailConfig.host).toBe('smtp.test.com');
      expect(result.emailConfig.fromEmail).toBe('hr@test.com');
    });
  });

  describe('uploadLogo', () => {
    it('rejects missing file', async () => {
      await CompanySettings.create({});
      const result = await SettingsService.uploadLogo(null, userId);
      expect(result.success).toBe(false);
    });

    it('rejects invalid file type', async () => {
      await CompanySettings.create({});
      const file = { mimetype: 'text/plain', size: 1000, filename: 'test.txt', originalname: 'test.txt' };
      const result = await SettingsService.uploadLogo(file, userId);
      expect(result.success).toBe(false);
    });

    it('rejects oversized file', async () => {
      await CompanySettings.create({});
      const file = { mimetype: 'image/jpeg', size: 5 * 1024 * 1024, filename: 'logo.jpg', originalname: 'logo.jpg' };
      const result = await SettingsService.uploadLogo(file, userId);
      expect(result.success).toBe(false);
    });

    it('accepts valid file', async () => {
      await CompanySettings.create({});
      const file = { mimetype: 'image/png', size: 1000, filename: 'logo.png', originalname: 'logo.png' };
      const result = await SettingsService.uploadLogo(file, userId);
      expect(result.success).toBe(true);
      expect(result.logoUrl).toBe('/uploads/logos/logo.png');
    });
  });
});
