import { Router } from 'express';
import { salarySlipsController } from './salarySlips.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', salarySlipsController.list);
router.get('/:id/pdf', salarySlipsController.generatePdf);

export default router;