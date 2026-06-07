import { Router, Request } from 'express';
import multer from 'multer';
import { documentController } from './document.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDocumentSchema, updateDocumentSchema } from './document.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import Employee from '../../models/Employee.model.js';

const memoryStorage = multer.memoryStorage();
const DOC_ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'application/x-pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
const DOC_MAX_SIZE = 10 * 1024 * 1024;

const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!DOC_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Allowed: images, PDFs, Word, Excel, and text files'));
    return;
  }
  if (file.size > DOC_MAX_SIZE) {
    cb(new Error('File size exceeds 10MB limit'));
    return;
  }
  cb(null, true);
};

const documentUpload = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: { fileSize: DOC_MAX_SIZE },
});

function parseJsonFields(fields: string[]) {
  return (req: any, _res: any, next: any) => {
    for (const field of fields) {
      if (typeof req.body[field] === 'string') {
        try { req.body[field] = JSON.parse(req.body[field]); } catch { /* keep as-is */ }
      }
    }
    next();
  };
}

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-documents'), documentController.list);
router.get('/company', authorize('view-documents'), documentController.getCompanyDocuments);
router.get('/employee/:employeeId', authorize('view-documents'), authorizeOwnership({ model: Employee, ownerField: '_id' }), documentController.getEmployeeDocuments);
router.get('/expiring', authorize('view-documents'), documentController.getExpiringDocuments);
router.get('/stats', authorize('view-documents'), documentController.getStats);
router.get('/:id', authorize('view-documents'), documentController.getById);
router.get('/:id/download', authorize('view-documents'), documentController.download);
router.post('/', authorize('manage-documents'), documentUpload.single('file'), parseJsonFields(['tags', 'accessRoles', 'isCompanyDocument']), validate(createDocumentSchema), documentController.upload);
router.patch('/:id', authorize('manage-documents'), documentUpload.single('file'), parseJsonFields(['tags', 'accessRoles', 'isCompanyDocument']), validate(updateDocumentSchema), documentController.update);
router.delete('/:id', authorize('manage-documents'), documentController.delete);

export default router;
