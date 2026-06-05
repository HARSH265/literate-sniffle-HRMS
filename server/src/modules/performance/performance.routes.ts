import { Router } from 'express';
import { performanceController } from './performance.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  createCycleSchema,
  updateCycleSchema,
  setGoalsSchema,
  submitSelfReviewSchema,
  submitManagerReviewSchema,
  submitFeedbackSchema,
  appealReviewSchema,
  resolveAppealSchema,
} from './performance.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';
import { authorizeOwnership } from '../../core/permissions/authorizeOwnership.middleware.js';
import PerformanceReview from '../../models/PerformanceReview.model.js';

const router = Router();

router.use(authenticate);

router.get('/cycles', authorize('view-performance'), performanceController.listCycles);
router.get('/cycles/all', authorize('view-performance'), performanceController.getAllCycles);
router.get('/cycles/:id/progress', authorize('manage-performance'), performanceController.getCycleProgress);
router.post('/cycles', authorize('manage-performance'), validate(createCycleSchema), performanceController.createCycle);
router.patch('/cycles/:id', authorize('manage-performance'), validate(updateCycleSchema), performanceController.updateCycle);

router.get('/reviews', authorize('view-performance'), performanceController.listReviews);
router.get('/reviews/my', authorize('view-own-performance'), performanceController.getMyReviews);
router.get('/reviews/pending', authorize('manage-performance'), performanceController.getPendingReviews);
router.get('/reviews/team', authorize('manage-performance'), performanceController.getTeamReviews);
router.get('/reviews/:id', authorize('view-performance'), performanceController.getReviewById);
router.patch('/reviews/:id/goals', authorize('manage-own-performance'), authorizeOwnership({ model: PerformanceReview }), validate(setGoalsSchema), performanceController.setGoals);
router.patch('/reviews/:id/self-review', authorize('manage-own-performance'), authorizeOwnership({ model: PerformanceReview }), validate(submitSelfReviewSchema), performanceController.submitSelfReview);
router.patch('/reviews/:id/manager-review', authorize('manage-performance'), validate(submitManagerReviewSchema), performanceController.submitManagerReview);
router.post('/reviews/:id/appeal', authorize('manage-own-performance'), authorizeOwnership({ model: PerformanceReview }), validate(appealReviewSchema), performanceController.appealReview);
router.post('/reviews/:id/resolve-appeal', authorize('manage-performance'), validate(resolveAppealSchema), performanceController.resolveAppeal);
router.post('/reviews/:id/finalize', authorize('manage-performance'), performanceController.finalizeReview);

router.post('/feedback/request/:id', authorize('request-feedback'), performanceController.requestFeedback);
router.post('/feedback/:reviewId', authorize('request-feedback'), validate(submitFeedbackSchema), performanceController.submitFeedback);

export default router;
