import { Router } from 'express';
import { salarySlipsController } from './salarySlips.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-reports'), salarySlipsController.list);
router.get('/:id/pdf', authorize('view-reports'), salarySlipsController.generatePdf);

export default router;