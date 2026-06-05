import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createDocumentSchema, updateDocumentSchema } from './document.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import Employee from '../../models/Employee.model.js';

const memoryStorage = multer.memoryStorage();
const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
