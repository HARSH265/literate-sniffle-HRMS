import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.getMyNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/mark-all-read', notificationsController.markAllAsRead);

export default router;