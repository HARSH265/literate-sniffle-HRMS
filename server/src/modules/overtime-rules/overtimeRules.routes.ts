import { Router } from 'express';
import { overtimeRulesController } from './overtimeRules.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createOvertimeRuleSchema, updateOvertimeRuleSchema } from './overtimeRules.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', overtimeRulesController.list);
router.get('/:id', overtimeRulesController.getById);
router.post('/', validate(createOvertimeRuleSchema), overtimeRulesController.create);
router.patch('/:id', validate(updateOvertimeRuleSchema), overtimeRulesController.update);
router.delete('/:id', overtimeRulesController.remove);

export default router;