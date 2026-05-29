import { Router } from 'express';
import { trainingController } from './training.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import {
  createProgramSchema,
  updateProgramSchema,
  batchEnrollSchema,
  completeEnrollmentSchema,
  createSkillSchema,
} from './training.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/programs', authorize('view-training'), trainingController.listPrograms);
router.get('/programs/:id', authorize('view-training'), trainingController.getProgramById);
router.post('/programs', authorize('manage-training'), validate(createProgramSchema), trainingController.createProgram);
router.patch('/programs/:id', authorize('manage-training'), validate(updateProgramSchema), trainingController.updateProgram);
router.delete('/programs/:id', authorize('manage-training'), trainingController.cancelProgram);

router.get('/enrollments/my', authorize('view-own-training'), trainingController.getMyEnrollments);
router.get('/enrollments/pending', authorize('view-own-training'), trainingController.getPendingEnrollments);
router.post('/enrollments', authorize('enroll-training'), trainingController.enrollEmployee);
router.post('/enrollments/batch', authorize('manage-training'), validate(batchEnrollSchema), trainingController.batchEnroll);
router.patch('/enrollments/:id/complete', authorize('manage-training'), validate(completeEnrollmentSchema), trainingController.markCompleted);
router.patch('/enrollments/:id/drop', authorize('manage-training'), trainingController.dropEnrollment);
router.post('/enrollments/:id/attendance', authorize('manage-training'), trainingController.recordAttendance);

router.get('/skills', authorize('view-training'), trainingController.listSkills);
router.get('/skills/my', authorize('view-own-training'), trainingController.getSkills);
router.get('/skills/employee/:employeeId', authorize('view-training'), trainingController.getSkills);
router.get('/skills/gap/:designationId', authorize('manage-training'), trainingController.getSkillGapAnalysis);
router.post('/skills', authorize('manage-training'), validate(createSkillSchema), trainingController.createSkill);
router.patch('/skills/employee/:employeeId/:skillId', authorize('manage-training'), trainingController.updateSkill);

router.get('/stats', authorize('manage-training'), trainingController.getStats);
router.get('/certifications/expiring', authorize('manage-training'), trainingController.getExpiringCertifications);

export default router;
