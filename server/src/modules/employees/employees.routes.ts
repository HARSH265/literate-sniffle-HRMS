import { Router } from 'express';
import { employeesController } from './employees.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import rateLimit from 'express-rate-limit';
import { createEmployeeSchema, updateEmployeeSchema, bulkAssignShiftSchema, listEmployeesSchema } from './employees.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { upload, uploadDocument, uploadPhoto } from '../../core/file/upload.middleware.js';

const router = Router();

const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: { success: false, message: 'Too many import requests, try again later', errors: [] },
});

const crudLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests, try again later', errors: [] },
});

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many export requests, try again later', errors: [] },
});

router.use(authenticate);

router.get('/next-code', authorize('view-employees'), employeesController.generateNextCode);
router.get('/', authorize('view-employees'), validate(listEmployeesSchema), employeesController.list);
router.get('/export', authorize('view-employees'), exportLimiter, employeesController.export);
router.get('/template', authorize('view-employees'), exportLimiter, employeesController.downloadTemplate);
router.post('/import', importLimiter, authorize('manage-employees'), upload.single('file'), employeesController.import);
router.patch('/bulk/shift', authorize('manage-employees'), validate(bulkAssignShiftSchema), employeesController.bulkAssignShift);
router.get('/:id', authorize('view-employees'), employeesController.getById);
router.post('/', authorize('manage-employees'), crudLimiter, validate(createEmployeeSchema), employeesController.create);
router.put('/:id', authorize('manage-employees'), crudLimiter, validate(updateEmployeeSchema), employeesController.update);
router.delete('/:id', authorize('manage-employees'), employeesController.remove);
router.post('/:id/restore', authorize('manage-employees'), employeesController.restore);
router.post('/:id/documents', authorize('manage-employees'), uploadDocument.single('file'), employeesController.uploadDocument);
router.get('/:id/documents/:docId', authorize('view-employees'), employeesController.downloadDocument);
router.delete('/:id/documents/:docId', authorize('manage-employees'), employeesController.removeDocument);
router.patch('/:id/photo', authorize('manage-employees'), uploadPhoto.single('photo'), employeesController.uploadPhoto);

export default router;