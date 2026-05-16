import { Router } from 'express';
import { weeklyOffRulesController } from './weeklyOffRules.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createWeeklyOffRuleSchema, updateWeeklyOffRuleSchema } from './weeklyOffRules.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', weeklyOffRulesController.list);
router.get('/:id', weeklyOffRulesController.getById);
router.post('/', validate(createWeeklyOffRuleSchema), weeklyOffRulesController.create);
router.patch('/:id', validate(updateWeeklyOffRuleSchema), weeklyOffRulesController.update);
router.delete('/:id', weeklyOffRulesController.remove);

export default router;