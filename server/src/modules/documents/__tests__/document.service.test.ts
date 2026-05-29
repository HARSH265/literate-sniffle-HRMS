import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Document from '../../../models/Document.model.js';
import User from '../../../models/User.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import { DocumentService } from '../document.service.js';

vi.mock('../../../core/file/FileUploadService.js', () => ({
  FileUploadService: {
    uploadFromBuffer: vi.fn().mockResolvedValue('https://res.cloudinary.com/mock-upload.pdf'),
  },
}));

let userId: string;

const mockFile = (name = 'test.pdf', size = 1024, mimeType = 'application/pdf'): Express.Multer.File => ({
  fieldname: 'file',
  originalname: name,
  encoding: '7bit',
  mimetype: mimeType,
  size,
  buffer: Buffer.from('fake file content'),
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
});

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({});

  const user = await User.create({
    name: 'Doc Admin',
    email: 'docadmin@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Document.deleteMany({});
});

describe('DocumentService', () => {
  describe('upload', () => {
    it('uploads a document', async () => {
      const result = await DocumentService.upload(
        { title: 'Test Document', category: 'Policy' },
        mockFile('policy.pdf', 2048),
        userId,
      );
      expect(result.title).toBe('Test Document');
      expect(result.category).toBe('Policy');
      expect(result.file.name).toBe('policy.pdf');
      expect(result.file.size).toBe(2048);
      expect(result.version).toBe(1);
      expect(result.isCompanyDocument).toBe(true);
      expect(result.uploadedBy.toString()).toBe(userId);
    });

    it('throws when document repo is disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'documentConfig.documentRepoEnabled': false } });
      await expect(
        DocumentService.upload({ title: 'Test', category: 'Policy' }, mockFile(), userId),
      ).rejects.toThrow('Document repository is disabled');
      await CompanySettings.updateOne({}, { $set: { 'documentConfig.documentRepoEnabled': true } });
    });

    it('throws on oversized file', async () => {
      const bigFile = mockFile('big.pdf', 50 * 1024 * 1024 + 1);
      await expect(
        DocumentService.upload({ title: 'Big', category: 'Policy' }, bigFile, userId),
      ).rejects.toThrow('File size exceeds maximum');
    });

    it('throws on disallowed file type', async () => {
      const badFile = mockFile('script.exe', 1024, 'application/x-msdownload');
      await expect(
        DocumentService.upload({ title: 'Bad', category: 'Policy' }, badFile, userId),
      ).rejects.toThrow('File type not allowed');
    });

    it('creates employee document when employee is provided', async () => {
      const result = await DocumentService.upload(
        { title: 'Employee Doc', category: 'Contract', employee: new mongoose.Types.ObjectId().toString(), isCompanyDocument: false },
        mockFile('contract.pdf'),
        userId,
      );
      expect(result.isCompanyDocument).toBe(false);
      expect(result.employee).toBeDefined();
    });
  });

  describe('list', () => {
    it('returns paginated documents', async () => {
      await Document.create([
        { title: 'Doc 1', category: 'Policy', file: { url: 'https://res.cloudinary.com/test.pdf', name: 'test.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'Doc 2', category: 'Policy', file: { url: 'https://res.cloudinary.com/test2.pdf', name: 'test2.pdf', size: 200, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'Doc 3', category: 'Contract', file: { url: 'https://res.cloudinary.com/test3.pdf', name: 'test3.pdf', size: 300, mimeType: 'application/pdf' }, uploadedBy: userId },
      ]);

      const result = await DocumentService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
    });

    it('filters by category', async () => {
      await Document.create([
        { title: 'Policy Doc', category: 'Policy', file: { url: 'https://res.cloudinary.com/p.pdf', name: 'p.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'Contract Doc', category: 'Contract', file: { url: 'https://res.cloudinary.com/c.pdf', name: 'c.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
      ]);

      const result = await DocumentService.list({ category: 'Contract' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('Contract Doc');
    });

    it('searches by title', async () => {
      await Document.create([
        { title: 'Employee Handbook', category: 'Policy', file: { url: 'https://res.cloudinary.com/h.pdf', name: 'h.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'Tax Form', category: 'Other', file: { url: 'https://res.cloudinary.com/t.pdf', name: 't.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
      ]);

      const result = await DocumentService.list({ search: 'Handbook' });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns document by id', async () => {
      const created = await DocumentService.upload(
        { title: 'Get Test', category: 'Policy' },
        mockFile(),
        userId,
      );
      const result = await DocumentService.getById(created._id.toString());
      expect(result).toBeDefined();
      expect(result!.title).toBe('Get Test');
    });

    it('returns null for non-existent id', async () => {
      const result = await DocumentService.getById(new mongoose.Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates document metadata', async () => {
      const created = await DocumentService.upload(
        { title: 'Original', category: 'Policy' },
        mockFile(),
        userId,
      );
      const updated = await DocumentService.update(
        created._id.toString(),
        { title: 'Updated Title', category: 'Contract' },
        undefined,
        userId,
      );
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.category).toBe('Contract');
    });

    it('creates new version when file is replaced', async () => {
      const created = await DocumentService.upload(
        { title: 'Versioned', category: 'Policy' },
        mockFile('v1.pdf'),
        userId,
      );
      const updated = await DocumentService.update(
        created._id.toString(),
        {},
        mockFile('v2.pdf'),
        userId,
      );
      expect(updated!.version).toBe(2);
      expect(updated!.file.name).toBe('v2.pdf');
      expect(updated!.previousVersions.length).toBe(1);
      expect(updated!.previousVersions[0].file.name).toBe('v1.pdf');
    });

    it('throws for non-existent id', async () => {
      await expect(
        DocumentService.update(
          new mongoose.Types.ObjectId().toString(),
          { title: 'Nope' },
          undefined,
          userId,
        ),
      ).rejects.toThrow('Document not found');
    });
  });

  describe('softDelete', () => {
    it('sets isActive to false', async () => {
      const created = await DocumentService.upload(
        { title: 'To Delete', category: 'Policy' },
        mockFile(),
        userId,
      );
      const deleted = await DocumentService.softDelete(created._id.toString(), userId);
      expect(deleted!.isActive).toBe(false);
    });
  });

  describe('getCompanyDocuments', () => {
    it('returns only company documents', async () => {
      await Document.create([
        { title: 'Company Doc', category: 'Policy', isCompanyDocument: true, file: { url: 'https://res.cloudinary.com/c.pdf', name: 'c.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'Employee Doc', category: 'Contract', isCompanyDocument: false, employee: new mongoose.Types.ObjectId(), file: { url: 'https://res.cloudinary.com/e.pdf', name: 'e.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
      ]);

      const result = await DocumentService.getCompanyDocuments();
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Company Doc');
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', async () => {
      await Document.create([
        { title: 'D1', category: 'Policy', file: { url: 'https://res.cloudinary.com/1.pdf', name: '1.pdf', size: 100, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'D2', category: 'Policy', file: { url: 'https://res.cloudinary.com/2.pdf', name: '2.pdf', size: 200, mimeType: 'application/pdf' }, uploadedBy: userId },
        { title: 'D3', category: 'Contract', file: { url: 'https://res.cloudinary.com/3.pdf', name: '3.pdf', size: 300, mimeType: 'application/pdf' }, uploadedBy: userId },
      ]);

      const stats = await DocumentService.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byCategory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: 'Policy', count: 2 }),
          expect.objectContaining({ _id: 'Contract', count: 1 }),
        ]),
      );
    });
  });

  describe('incrementDownload', () => {
    it('increments download count', async () => {
      const created = await DocumentService.upload(
        { title: 'Downloadable', category: 'Policy' },
        mockFile(),
        userId,
      );
      await DocumentService.incrementDownload(created._id.toString());
      const result = await DocumentService.getById(created._id.toString());
      expect(result!.downloadCount).toBe(1);
    });
  });
});
