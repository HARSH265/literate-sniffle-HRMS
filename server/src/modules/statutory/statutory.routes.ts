import { Router } from 'express';
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
} from './statutory.validation.js';

const router = Router();

router.get('/defaults', authorize('view-statutory'), getDefaultsHandler);

router.post('/calculate', authorize('manage-statutory'), validate(calculateStatutorySchema), calculateHandler);

router.get('/summary/:month', authorize('view-statutory'), getSummaryHandler);

router.post('/challans/generate/:month', authorize('manage-statutory'), generateChallanHandler);
router.get('/challans', authorize('view-statutory'), listChallansHandler);
router.get('/challans/:id', authorize('view-statutory'), getChallanHandler);
router.patch('/challans/:id', authorize('manage-statutory'), validate(updateChallanSchema), patchChallanHandler);

router.post('/reports/generate', authorize('manage-statutory'), validate(generateReportSchema), generateReportHandler);
router.get('/reports', authorize('view-statutory'), listReportsHandler);
router.get('/reports/:id', authorize('view-statutory'), getReportHandler);
router.patch('/reports/:id', authorize('manage-statutory'), validate(updateReportSchema), patchReportHandler);

export default router;
