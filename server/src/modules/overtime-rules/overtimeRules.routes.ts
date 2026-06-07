import { Router } from 'express';
import { overtimeRulesController } from './overtimeRules.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createOvertimeRuleSchema, updateOvertimeRuleSchema } from './overtimeRules.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-departments'), overtimeRulesController.list);
router.get('/:id', authorize('view-departments'), overtimeRulesController.getById);
router.post('/', authorize('manage-departments'), validate(createOvertimeRuleSchema), overtimeRulesController.create);
router.patch('/:id', authorize('manage-departments'), validate(updateOvertimeRuleSchema), overtimeRulesController.update);
router.delete('/:id', authorize('manage-departments'), overtimeRulesController.remove);

export default router;