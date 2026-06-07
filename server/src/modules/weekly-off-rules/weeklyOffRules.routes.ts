import { Router } from 'express';
import { weeklyOffRulesController } from './weeklyOffRules.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createWeeklyOffRuleSchema, updateWeeklyOffRuleSchema } from './weeklyOffRules.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), weeklyOffRulesController.list);
router.get('/:id', authorize('view-departments'), weeklyOffRulesController.getById);
router.post('/', authorize('manage-departments'), validate(createWeeklyOffRuleSchema), weeklyOffRulesController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateWeeklyOffRuleSchema), weeklyOffRulesController.update);
router.delete('/:id', authorize('manage-departments'), weeklyOffRulesController.remove);

export default router;