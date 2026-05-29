import Asset, { IAsset } from '../../models/Asset.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { AppError } from '../../core/errors/AppError.js';

interface CreateAssetData {
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  brand?: string;
  assetModel?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition?: string;
  location?: string;
  notes?: string;
}

interface ListOptions {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  assignedTo?: string;
  search?: string;
  sort?: string;
}

async function generateAssetCode(): Promise<string> {
  const settings = await CompanySettings.findOne();
  const prefix = settings?.assetConfig?.assetCodePrefix || 'AST';
  const padding = settings?.assetConfig?.assetCodePadding || 4;

  const lastAsset = await Asset.findOne({ assetCode: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select('assetCode')
    .lean();

  let nextNum = 1;
  if (lastAsset) {
    const lastCode = lastAsset.assetCode;
    const numPart = lastCode.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `${prefix}${String(nextNum).padStart(padding, '0')}`;
}

export class AssetService {
  static async create(data: CreateAssetData, userId: string): Promise<IAsset> {
    const settings = await CompanySettings.findOne();
    if (settings?.assetConfig?.assetManagementEnabled === false) {
      throw new AppError('Asset management is disabled', 400);
    }

    let assetCode: string = data.serialNumber || '';
    if (settings?.assetConfig?.autoGenerateAssetCode !== false) {
      assetCode = await generateAssetCode();
    } else if (!data.serialNumber) {
      throw new AppError('Asset code or serial number is required when auto-generation is disabled', 400);
    }

    if (data.serialNumber) {
      const existing = await Asset.findOne({ serialNumber: data.serialNumber, isActive: true }).lean();
      if (existing) {
        throw new AppError('An asset with this serial number already exists', 400);
      }
    }

    const asset = await Asset.create({
      assetCode,
      name: data.name,
      category: data.category,
      description: data.description,
      serialNumber: data.serialNumber,
      brand: data.brand,
      assetModel: data.assetModel,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice,
      condition: data.condition || 'New',
      status: 'available',
      location: data.location,
      notes: data.notes,
      createdBy: userId as any,
      history: [],
      isActive: true,
    });

    await AuditService.log({
      userId: userId as any, action: 'create', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { category: asset.category },
    });

    return asset;
  }

  static async list(options: ListOptions) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (options.category) filter.category = options.category;
    if (options.status) filter.status = options.status;
    if (options.assignedTo) filter.assignedTo = options.assignedTo;

    if (options.search) {
      const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { assetCode: { $regex: escaped, $options: 'i' } },
        { serialNumber: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortOrder: Record<string, 1 | -1> = {};
    if (options.sort === 'oldest') sortOrder.createdAt = 1;
    else if (options.sort === 'name') sortOrder.name = 1;
    else if (options.sort === 'status') sortOrder.status = 1;
    else sortOrder.createdAt = -1;

    const [data, total] = await Promise.all([
      Asset.find(filter)
        .sort(sortOrder).skip(skip).limit(limit)
        .populate('assignedTo', 'fullName employeeCode')
        .populate('createdBy', 'name email')
        .lean(),
      Asset.countDocuments(filter),
    ]);

    return {
      data: data.map((d: any) => ({ ...d, id: String(d._id), _id: undefined })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string): Promise<IAsset | null> {
    return Asset.findById(id)
      .populate('assignedTo', 'fullName employeeCode department')
      .populate('createdBy', 'name email')
      .populate('history.employee', 'fullName employeeCode');
  }

  static async update(id: string, data: Partial<CreateAssetData>, userId: string): Promise<IAsset | null> {
    const asset = await Asset.findById(id);
    if (!asset) throw new AppError('Asset not found', 404);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.serialNumber !== undefined) {
      if (data.serialNumber) {
        const existing = await Asset.findOne({ serialNumber: data.serialNumber, _id: { $ne: id }, isActive: true }).lean();
        if (existing) throw new AppError('An asset with this serial number already exists', 400);
      }
      updateData.serialNumber = data.serialNumber;
    }
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.assetModel !== undefined) updateData.assetModel = data.assetModel;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.notes !== undefined) updateData.notes = data.notes;

    Object.assign(asset, updateData);
    await asset.save();

    await AuditService.log({
      userId: userId as any, action: 'update', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { updatedFields: Object.keys(updateData) },
    });

    return asset;
  }

  static async allocate(assetId: string, employeeId: string, notes: string | undefined, userId: string): Promise<IAsset | null> {
    const settings = await CompanySettings.findOne();
    const allowMultiple = settings?.assetConfig?.allowMultipleAllocation || false;

    const asset = await Asset.findById(assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    if (asset.status === 'retired') throw new AppError('Cannot allocate a retired asset', 400);
    if (asset.status === 'allocated' && !allowMultiple) throw new AppError('Asset is already allocated', 400);

    asset.status = 'allocated';
    asset.assignedTo = employeeId as any;
    asset.assignedAt = new Date();
    asset.history.push({ employee: employeeId as any, action: 'allocated', date: new Date(), notes: notes || undefined });
    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'fullName employeeCode')
      .populate('history.employee', 'fullName employeeCode');

    await AuditService.log({
      userId: userId as any, action: 'update', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { action: 'allocated', employeeId },
    });

    return populated;
  }

  static async returnAsset(assetId: string, condition: string | undefined, notes: string | undefined, userId: string): Promise<IAsset | null> {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    if (asset.status !== 'allocated') throw new AppError('Asset is not currently allocated', 400);

    const previousEmployee = asset.assignedTo;
    asset.status = 'available';
    if (condition) asset.condition = condition;
    asset.assignedTo = null as any;
    asset.assignedAt = undefined as any;
    asset.returnedAt = new Date();
    asset.history.push({ employee: previousEmployee, action: 'returned', date: new Date(), notes: notes || undefined });
    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'fullName employeeCode')
      .populate('history.employee', 'fullName employeeCode');

    await AuditService.log({
      userId: userId as any, action: 'update', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { action: 'returned' },
    });

    return populated;
  }

  static async markMaintenance(assetId: string, notes: string | undefined, userId: string): Promise<IAsset | null> {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    if (asset.status === 'retired') throw new AppError('Cannot mark a retired asset as under maintenance', 400);

    const wasAllocated = asset.status === 'allocated';
    const previousEmployee = asset.assignedTo;
    asset.status = 'maintenance';
    if (wasAllocated) {
      asset.assignedTo = undefined as any;
      asset.assignedAt = undefined as any;
    }
    asset.history.push({ employee: previousEmployee, action: 'maintenance', date: new Date(), notes: notes || undefined });
    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'fullName employeeCode')
      .populate('history.employee', 'fullName employeeCode');

    await AuditService.log({
      userId: userId as any, action: 'update', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { action: 'maintenance' },
    });

    return populated;
  }

  static async retire(assetId: string, notes: string | undefined, userId: string): Promise<IAsset | null> {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    if (asset.status === 'retired') throw new AppError('Asset is already retired', 400);

    const wasAllocated = asset.status === 'allocated';
    const previousEmployee = asset.assignedTo;
    asset.status = 'retired';
    if (wasAllocated) {
      asset.assignedTo = undefined as any;
      asset.assignedAt = undefined as any;
    }
    asset.history.push({ employee: previousEmployee, action: 'retired', date: new Date(), notes: notes || undefined });
    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'fullName employeeCode')
      .populate('history.employee', 'fullName employeeCode');

    await AuditService.log({
      userId: userId as any, action: 'update', module: 'assets',
      targetId: asset._id.toString(), targetName: `${asset.assetCode} - ${asset.name}`,
      details: { action: 'retired' },
    });

    return populated;
  }

  static async getEmployeeAssets(employeeId: string) {
    return Asset.find({ assignedTo: employeeId, isActive: true, status: 'allocated' })
      .populate('assignedTo', 'fullName employeeCode')
      .lean();
  }

  static async getStats() {
    const [total, byStatus, byCategory] = await Promise.all([
      Asset.countDocuments({ isActive: true }),
      Asset.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Asset.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap: Record<string, number> = { available: 0, allocated: 0, maintenance: 0, retired: 0 };
    byStatus.forEach((s: { _id: string; count: number }) => { statusMap[s._id] = s.count; });

    const categoryMap: Record<string, number> = {};
    byCategory.forEach((c: { _id: string; count: number }) => { categoryMap[c._id] = c.count; });

    return { total, byStatus: statusMap, byCategory: categoryMap };
  }

  static async getHistory(assetId: string) {
    const asset = await Asset.findById(assetId)
      .populate('history.employee', 'fullName employeeCode')
      .select('history assetCode name')
      .lean();
    return asset?.history || [];
  }
}
