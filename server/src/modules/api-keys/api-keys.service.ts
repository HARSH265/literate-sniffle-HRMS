import ApiKey from '../../models/ApiKey.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { CreateApiKeyInput } from './api-keys.validation.js';

export class ApiKeyService {
  static async create(data: CreateApiKeyInput, userId: string): Promise<{ key: string; name: string; prefix: string; permissions: string[]; expiresAt?: Date }> {
    const { key, hash, prefix } = (ApiKey as any).generateKey();

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey = await ApiKey.create({
      name: data.name,
      key,
      keyHash: hash,
      prefix,
      permissions: data.permissions,
      rateLimit: data.rateLimit || 1000,
      expiresAt,
      createdBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'api-keys',
      userId,
      targetId: apiKey._id.toString(),
      targetName: data.name,
      details: { permissions: data.permissions, prefix },
    });

    return { key, name: data.name, prefix, permissions: data.permissions, expiresAt };
  }

  static async list(userId: string, page = 1, limit = 20): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;
    const [keys, total] = await Promise.all([
      ApiKey.find({ createdBy: userId })
        .select('-key -keyHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ApiKey.countDocuments({ createdBy: userId }),
    ]);

    return {
      data: keys.map((k: any) => ({
        id: String(k._id),
        name: k.name,
        prefix: k.prefix,
        permissions: k.permissions,
        rateLimit: k.rateLimit,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async revoke(id: string, userId: string): Promise<void> {
    const key = await ApiKey.findById(id);
    if (!key) throw new AppError('API key not found', 404);
    if (String(key.createdBy) !== userId) throw new AppError('Not authorized', 403);

    key.isActive = false;
    await key.save();

    await AuditService.log({
      action: 'deactivate',
      module: 'api-keys',
      userId,
      targetId: id,
      targetName: key.name,
    });
  }

  static async validateKey(rawKey: string): Promise<{ id: string; permissions: string[]; rateLimit: number } | null> {
    const hash = (ApiKey as any).hashKey(rawKey);
    const key = await ApiKey.findOne({ keyHash: hash, isActive: true });

    if (!key) return null;

    if (key.expiresAt && key.expiresAt < new Date()) {
      key.isActive = false;
      await key.save();
      return null;
    }

    key.lastUsedAt = new Date();
    await key.save();

    return { id: String(key._id), permissions: key.permissions, rateLimit: key.rateLimit };
  }
}
