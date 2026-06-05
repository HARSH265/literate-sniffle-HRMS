import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { ROLES } from '../../config/constants.js';

interface OwnershipOptions {
  /** Mongoose model to query the resource */
  model: mongoose.Model<any>;
  /** Field on the resource that holds the owner identifier (default: 'employee') */
  ownerField?: string;
  /** Field on req.user to compare against (default: 'employeeId') */
  userField?: string;
  /** Roles that bypass ownership checks (default: super-admin, hr-admin, hr-staff) */
  adminBypassRoles?: string[];
}

/**
 * Middleware factory: verifies the authenticated user owns the resource.
 *
 * Usage:
 *   router.delete('/:id', authenticate, authorize('manage-loans'), authorizeOwnership({ model: Loan }), deleteLoan);
 *
 * Flow:
 *   1. Fetches resource by req.params.id from the specified model
 *   2. Compares resource[ownerField] against req.user[userField]
 *   3. If mismatch AND user is not in adminBypassRoles → 403
 *   4. If match or admin → next()
 *
 * Also attaches the fetched resource to req for downstream use:
 *   (req as any).resource = fetchedResource
 */
export function authorizeOwnership(options: OwnershipOptions) {
  const {
    model,
    ownerField = 'employee',
    userField = 'employeeId',
    adminBypassRoles = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.HR_STAFF],
  } = options;

  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = _req.user;

      if (!user) {
        throw new AppError('Not authenticated', 401);
      }

      // Admin bypass
      if (adminBypassRoles.includes(user.role)) {
        next();
        return;
      }

      const resourceId = _req.params.id;

      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        throw new AppError('Invalid resource ID', 400);
      }

      const resource = await model.findById(resourceId).lean();

      if (!resource) {
        throw new AppError('Resource not found', 404);
      }

      const ownerValue = (resource as any)[ownerField];
      const userValue = (user as any)[userField];

      // If resource has no owner field set, deny access (fail closed)
      if (!ownerValue) {
        throw new AppError('Access denied — resource has no owner', 403);
      }

      // If user has no linking field, deny access
      if (!userValue) {
        throw new AppError('Access denied — no employee linked to your account', 403);
      }

      // Compare — handle both ObjectId and string formats
      const ownerId = ownerValue.toString();
      const userId = userValue.toString();

      if (ownerId !== userId) {
        throw new AppError('Access denied — you do not own this resource', 403);
      }

      // Attach resource to request for downstream use (avoids re-fetching)
      (_req as any).resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Convenience: ownership check using User._id (createdBy pattern).
 * For resources where the owner is the User who created them (not an Employee).
 */
export function authorizeCreator(options: Omit<OwnershipOptions, 'ownerField' | 'userField'>) {
  return authorizeOwnership({
    ...options,
    ownerField: 'createdBy',
    userField: 'id',
  });
}
