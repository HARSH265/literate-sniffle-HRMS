import { Router } from 'express';
import { assetController } from './asset.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  createAssetSchema,
  updateAssetSchema,
  allocateAssetSchema,
  returnAssetSchema,
  maintenanceAssetSchema,
  retireAssetSchema,
} from './asset.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import Employee from '../../models/Employee.model.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-assets'), assetController.list);
router.get('/stats', authorize('view-assets'), assetController.getStats);
router.get('/employee/:employeeId', authorize('view-assets'), authorizeOwnership({ model: Employee, ownerField: '_id' }), assetController.getEmployeeAssets);
router.get('/:id', authorize('view-assets'), assetController.getById);
router.get('/:id/history', authorize('view-assets'), assetController.getHistory);
router.post('/', authorize('manage-assets'), validate(createAssetSchema), assetController.create);
router.patch('/:id', authorize('manage-assets'), validate(updateAssetSchema), assetController.update);
router.post('/:id/allocate', authorize('manage-assets'), validate(allocateAssetSchema), assetController.allocate);
router.post('/:id/return', authorize('manage-assets'), validate(returnAssetSchema), assetController.returnAsset);
router.post('/:id/maintenance', authorize('manage-assets'), validate(maintenanceAssetSchema), assetController.markMaintenance);
router.post('/:id/retire', authorize('manage-assets'), validate(retireAssetSchema), assetController.retire);

export default router;
