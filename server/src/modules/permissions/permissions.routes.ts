import { Router } from 'express';
import { permissionsController } from './permissions.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { updateRolePermissionsSchema, roleParamSchema } from './permissions.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

// Get all permission groups and definitions (for UI)
router.get('/groups', authorize('manage-users'), permissionsController.getPermissionGroups);

// Get permissions for all roles
router.get('/roles', authorize('manage-users'), permissionsController.getRolePermissions);

// Get permissions for a specific role
router.get('/roles/:role', authorize('manage-users'), validate(roleParamSchema, 'params'), permissionsController.getRolePermission);

// Update permissions for a role
router.put(
  '/roles/:role',
  authorize('manage-users'),
  validate(roleParamSchema, 'params'),
  validate(updateRolePermissionsSchema),
  permissionsController.updateRolePermissions,
);

// Reset a role's permissions to defaults
router.post(
  '/roles/:role/reset',
  authorize('manage-users'),
  validate(roleParamSchema, 'params'),
  permissionsController.resetRolePermissions,
);

export default router;
