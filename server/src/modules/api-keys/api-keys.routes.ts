import { Router } from 'express';
import { ApiKeyService } from './api-keys.service.js';
import { createApiKeySchema } from './api-keys.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('manage-settings'),
  validate(createApiKeySchema),
  async (req: any, res, next) => {
    try {
      const result = await ApiKeyService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        message: 'API key created. Store the key securely — it will not be shown again.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/',
  authenticate,
  authorize('manage-settings'),
  async (req: any, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await ApiKeyService.list(req.user!.id, page, limit);
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticate,
  authorize('manage-settings'),
  async (req: any, res, next) => {
    try {
      await ApiKeyService.revoke(req.params.id, req.user!.id);
      res.json({ success: true, message: 'API key revoked' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
