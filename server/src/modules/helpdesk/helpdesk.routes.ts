import { Router } from 'express';
import { helpdeskController } from './helpdesk.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createTicketSchema, updateTicketSchema, addCommentSchema } from './helpdesk.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-tickets'), helpdeskController.list);
router.get('/stats', authorize('view-tickets'), helpdeskController.stats);
router.post('/check-sla', authorize('manage-tickets'), helpdeskController.checkSla);
router.get('/:id', authorize('view-tickets'), helpdeskController.getById);
router.post('/', authorize('manage-tickets'), validate(createTicketSchema), helpdeskController.create);
router.put('/:id', authorize('manage-tickets'), validate(updateTicketSchema), helpdeskController.update);
router.post('/:id/comments', authorize('view-tickets'), validate(addCommentSchema), helpdeskController.addComment);
router.delete('/:id', authorize('manage-tickets'), helpdeskController.delete);

export default router;
