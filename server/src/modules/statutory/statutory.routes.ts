import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  getDefaultsHandler,
  calculateHandler,
  generateChallanHandler,
  listChallansHandler,
  getChallanHandler,
  patchChallanHandler,
  generateReportHandler,
  listReportsHandler,
  getReportHandler,
  patchReportHandler,
  getSummaryHandler,
} from './statutory.controller.js';
import {
  calculateStatutorySchema,
  generateReportSchema,
  updateChallanSchema,
  updateReportSchema,
  monthParamSchema,
} from './statutory.validation.js';

const router = Router();

const statutoryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many statutory requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(statutoryRateLimit);

router.get('/defaults', authorize('view-statutory'), getDefaultsHandler);

router.post('/calculate', authorize('manage-statutory'), validate(calculateStatutorySchema), calculateHandler);

router.get('/summary/:month', authorize('view-statutory'), validate(monthParamSchema, 'params'), getSummaryHandler);

router.post('/challans/generate/:month', authorize('manage-statutory'), validate(monthParamSchema, 'params'), generateChallanHandler);
router.get('/challans', authorize('view-statutory'), listChallansHandler);
router.get('/challans/:id', authorize('view-statutory'), getChallanHandler);
router.patch('/challans/:id', authorize('manage-statutory'), validate(updateChallanSchema), patchChallanHandler);

router.post('/reports/generate', authorize('manage-statutory'), validate(generateReportSchema), generateReportHandler);
router.get('/reports', authorize('view-statutory'), listReportsHandler);
router.get('/reports/:id', authorize('view-statutory'), getReportHandler);
router.patch('/reports/:id', authorize('manage-statutory'), validate(updateReportSchema), patchReportHandler);

export default router;
