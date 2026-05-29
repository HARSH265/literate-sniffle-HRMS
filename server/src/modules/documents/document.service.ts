import { SortOrder } from 'mongoose';
import Document, { IDocument } from '../../models/Document.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { FileUploadService } from '../../core/file/FileUploadService.js';
import { AppError } from '../../core/errors/AppError.js';

interface CreateDocumentData {
  title: string;
  description?: string;
  category: string;
  employee?: string;
  isCompanyDocument?: boolean;
  tags?: string[];
  expiryDate?: string;
  accessRoles?: string[];
}

interface ListOptions {
  page?: number;
  limit?: number;
  category?: string;
  employee?: string;
  isCompanyDocument?: boolean;
  search?: string;
  sort?: string;
}

function getMimeTypeFromExt(filename: string, defaultType = 'application/octet-stream'): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
  };
  return map[ext || ''] || defaultType;
}

async function getSettings() {
  const settings = await CompanySettings.findOne().lean();
  return (settings as any)?.documentConfig || {
    documentRepoEnabled: true,
    maxFileSizeMb: 20,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png'],
    enableVersioning: true,
    maxVersions: 10,
    autoExpireReminderDays: 30,
  };
}

export class DocumentService {
  static async upload(data: CreateDocumentData, file: Express.Multer.File, userId: string): Promise<IDocument> {
    const settings = await getSettings();

    if (!settings.documentRepoEnabled) {
      throw new AppError('Document repository is disabled', 400);
    }

    const maxSizeBytes = settings.maxFileSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new AppError(`File size exceeds maximum of ${settings.maxFileSizeMb}MB`, 400);
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !settings.allowedFileTypes.includes(ext)) {
      throw new AppError(`File type not allowed. Allowed: ${settings.allowedFileTypes.join(', ')}`, 400);
    }

    const url = await FileUploadService.uploadFromBuffer(file.buffer, `documents/${data.category.toLowerCase()}`);

    const document = await Document.create({
      title: data.title,
      description: data.description,
      category: data.category,
      file: { url, name: file.originalname, size: file.size, mimeType: getMimeTypeFromExt(file.originalname) },
      employee: data.employee || undefined,
      isCompanyDocument: data.isCompanyDocument ?? !data.employee,
      version: 1,
      previousVersions: [],
      tags: data.tags || [],
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      accessRoles: data.accessRoles || [],
      uploadedBy: userId,
      downloadCount: 0,
      isActive: true,
    });

    await AuditService.log({
      action: 'create', module: 'documents', userId,
      targetId: document._id.toString(), targetName: document.title,
      details: { title: data.title, category: data.category, fileSize: file.size },
    });

    return document;
  }

  static async list(options: ListOptions): Promise<{ data: any[]; meta: any }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, options.limit || 20);
    const skip = (page - 1) * limit;
    const filter: any = { isActive: true };

    if (options.category) filter.category = options.category;
    if (options.employee) filter.employee = options.employee;
    if (options.isCompanyDocument !== undefined) filter.isCompanyDocument = options.isCompanyDocument;
    if (options.search) {
      const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sort: Record<string, SortOrder> = options.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const [docs, total] = await Promise.all([
      Document.find(filter).sort(sort).skip(skip).limit(limit).populate('uploadedBy', 'name email').lean(),
      Document.countDocuments(filter),
    ]);

    return {
      data: docs.map((d: any) => ({ ...d, id: String(d._id), _id: undefined })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string): Promise<IDocument | null> {
    const doc = await Document.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('employee', 'fullName employeeCode');
    return doc;
  }

  static async update(id: string, data: any, file: Express.Multer.File | undefined, userId: string): Promise<IDocument | null> {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError('Document not found', 404);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
    if (data.accessRoles !== undefined) updateData.accessRoles = data.accessRoles;

    if (file) {
      const settings = await getSettings();
      const maxSizeBytes = settings.maxFileSizeMb * 1024 * 1024;
      if (file.size > maxSizeBytes) throw new AppError(`File size exceeds maximum of ${settings.maxFileSizeMb}MB`, 400);

      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!ext || !settings.allowedFileTypes.includes(ext)) {
        throw new AppError(`File type not allowed. Allowed: ${settings.allowedFileTypes.join(', ')}`, 400);
      }

      if (settings.enableVersioning) {
        const prevVersions = doc.previousVersions || [];
        if (prevVersions.length >= settings.maxVersions) {
          prevVersions.shift();
        }
        prevVersions.push({
          file: { url: doc.file.url, name: doc.file.name, size: doc.file.size, mimeType: doc.file.mimeType },
          version: doc.version,
          uploadedBy: userId as any,
          uploadedAt: new Date(),
        });
        updateData.previousVersions = prevVersions;
        updateData.version = doc.version + 1;
      }

      const url = await FileUploadService.uploadFromBuffer(file.buffer, `documents/${(data.category || doc.category).toLowerCase()}`);
      updateData.file = { url, name: file.originalname, size: file.size, mimeType: getMimeTypeFromExt(file.originalname) };
    }

    Object.assign(doc, updateData);
    await doc.save();

    await AuditService.log({
      action: 'update', module: 'documents', userId,
      targetId: doc._id.toString(), targetName: doc.title,
      details: { updatedFields: Object.keys(updateData) },
    });

    return doc;
  }

  static async softDelete(id: string, userId: string): Promise<IDocument | null> {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError('Document not found', 404);

    doc.isActive = false;
    (doc as any).updatedBy = userId;
    await doc.save();

    await AuditService.log({
      action: 'delete', module: 'documents', userId,
      targetId: doc._id.toString(), targetName: doc.title,
    });

    return doc;
  }

  static async incrementDownload(id: string): Promise<IDocument | null> {
    const doc = await Document.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } }, { new: true });
    return doc;
  }

  static async getEmployeeDocuments(employeeId: string): Promise<any[]> {
    return Document.find({ employee: employeeId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  static async getCompanyDocuments(): Promise<any[]> {
    return Document.find({ isCompanyDocument: true, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  static async getExpiringDocuments(days?: number): Promise<any[]> {
    const settings = await getSettings();
    const reminderDays = days ?? settings.autoExpireReminderDays;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);

    return Document.find({
      isActive: true,
      expiryDate: { $lte: targetDate, $gte: new Date() },
    }).populate('uploadedBy', 'name email').sort({ expiryDate: 1 }).lean();
  }

  static async getStats(): Promise<any> {
    const [total, byCategory, active, expiringSoon] = await Promise.all([
      Document.countDocuments({ isActive: true }),
      Document.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Document.countDocuments({ isActive: true, isCompanyDocument: true }),
      Document.countDocuments({
        isActive: true,
        expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() },
      }),
    ]);

    return { total, byCategory, activeCompanyDocs: active, expiringWithin30Days: expiringSoon };
  }
}
