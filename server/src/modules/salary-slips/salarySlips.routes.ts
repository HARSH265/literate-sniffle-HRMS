import { Router } from 'express';
import { salarySlipsController } from './salarySlips.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many PDF requests, try again later', errors: [] },
});

router.use(authenticate);

router.get('/', authorize('view-reports'), salarySlipsController.list);
router.get('/:id/preview', authorize('view-reports'), salarySlipsController.preview);
router.get('/:id/pdf', pdfLimiter, authorize('view-reports'), salarySlipsController.generatePdf);
router.get('/:id/excel', pdfLimiter, authorize('view-reports'), salarySlipsController.generateExcel);

export default router;