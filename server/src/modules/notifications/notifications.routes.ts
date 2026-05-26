import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { listNotificationsSchema, markAsReadSchema, markAllAsReadSchema } from './notifications.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsSchema, 'query'), notificationsController.getMyNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/:id/read', validate(markAsReadSchema), notificationsController.markAsRead);
router.patch('/mark-all-read', validate(markAllAsReadSchema), notificationsController.markAllAsRead);

export default router;