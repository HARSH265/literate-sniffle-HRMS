import { Request, Response } from 'express';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { DocumentService } from './document.service.js';

export const documentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' }); return;
    }
    const document = await DocumentService.upload(req.body, req.file, userId.toString());
    ResponseHandler.created(res, document, 'Document uploaded successfully');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await DocumentService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category: req.query.category as string,
      employee: req.query.employee as string,
      isCompanyDocument: req.query.isCompanyDocument === 'true' ? true : req.query.isCompanyDocument === 'false' ? false : undefined,
      search: req.query.search as string,
      sort: req.query.sort as string,
    });
    ResponseHandler.paginated(res, result.data, result.meta, 'Documents fetched successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const document = await DocumentService.getById(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' }); return;
    }
    ResponseHandler.success(res, document, 'Document fetched successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const document = await DocumentService.update(req.params.id, req.body, req.file, userId.toString());
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' }); return;
    }
    ResponseHandler.success(res, document, 'Document updated successfully');
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    await DocumentService.softDelete(req.params.id, userId.toString());
    ResponseHandler.noContent(res);
  }),

  getEmployeeDocuments: asyncHandler(async (req: Request, res: Response) => {
    const documents = await DocumentService.getEmployeeDocuments(req.params.employeeId);
    ResponseHandler.success(res, documents, 'Documents fetched successfully');
  }),

  getCompanyDocuments: asyncHandler(async (_req: Request, res: Response) => {
    const documents = await DocumentService.getCompanyDocuments();
    ResponseHandler.success(res, documents, 'Documents fetched successfully');
  }),

  getExpiringDocuments: asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const documents = await DocumentService.getExpiringDocuments(days);
    ResponseHandler.success(res, documents, 'Documents fetched successfully');
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await DocumentService.getStats();
    ResponseHandler.success(res, stats, 'Stats fetched successfully');
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const document = await DocumentService.incrementDownload(req.params.id);
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' }); return;
    }
    res.redirect(document.file.url);
  }),
};
