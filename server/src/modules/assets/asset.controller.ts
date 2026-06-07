import { Request, Response } from 'express';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { AssetService } from './asset.service.js';

export const assetController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const asset = await AssetService.create(req.body, userId.toString());
    ResponseHandler.created(res, asset, 'Asset created successfully');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await AssetService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category: req.query.category as string,
      status: req.query.status as string,
      assignedTo: req.query.assignedTo as string,
      search: req.query.search as string,
      sort: req.query.sort as string,
    });
    ResponseHandler.paginated(res, result.data, result.meta, 'Assets fetched successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const asset = await AssetService.getById(req.params.id);
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset fetched successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const asset = await AssetService.update(req.params.id, req.body, userId.toString());
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset updated successfully');
  }),

  allocate: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { employeeId, notes } = req.body;
    const asset = await AssetService.allocate(req.params.id, employeeId, notes, userId.toString());
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset allocated successfully');
  }),

  returnAsset: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { condition, notes } = req.body;
    const asset = await AssetService.returnAsset(req.params.id, condition, notes, userId.toString());
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset returned successfully');
  }),

  markMaintenance: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { notes } = req.body;
    const asset = await AssetService.markMaintenance(req.params.id, notes, userId.toString());
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset marked as maintenance');
  }),

  retire: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { notes } = req.body;
    const asset = await AssetService.retire(req.params.id, notes, userId.toString());
    if (!asset) { ResponseHandler.error(res, 'Asset not found', 404); return; }
    ResponseHandler.success(res, asset, 'Asset retired successfully');
  }),

  getEmployeeAssets: asyncHandler(async (req: Request, res: Response) => {
    const assets = await AssetService.getEmployeeAssets(req.params.employeeId);
    ResponseHandler.success(res, assets, 'Assets fetched successfully');
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await AssetService.getStats();
    ResponseHandler.success(res, stats, 'Stats fetched successfully');
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await AssetService.getHistory(req.params.id);
    ResponseHandler.success(res, history, 'History fetched successfully');
  }),
};
