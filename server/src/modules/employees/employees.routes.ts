import { Router } from 'express';
import { employeesController } from './employees.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { upload, uploadDocument } from '../../core/file/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-employees'), employeesController.list);
router.get('/export', authorize('view-employees'), employeesController.export);
router.get('/template', authorize('view-employees'), employeesController.downloadTemplate);
router.post('/import', authorize('manage-employees'), upload.single('file'), employeesController.import);
router.get('/:id', authorize('view-employees'), employeesController.getById);
router.post('/', authorize('manage-employees'), validate(createEmployeeSchema), employeesController.create);
router.put('/:id', authorize('manage-employees'), validate(updateEmployeeSchema), employeesController.update);
router.delete('/:id', authorize('manage-employees'), employeesController.remove);
router.post('/:id/documents', authorize('manage-employees'), uploadDocument.single('file'), employeesController.uploadDocument);
router.delete('/:id/documents/:docId', authorize('manage-employees'), employeesController.removeDocument);

export default router;