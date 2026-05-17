import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-employees'), notificationsController.getMyNotifications);
router.get('/unread-count', authorize('view-employees'), notificationsController.getUnreadCount);
router.patch('/:id/read', authorize('view-employees'), notificationsController.markAsRead);
router.patch('/mark-all-read', authorize('view-employees'), notificationsController.markAllAsRead);

export default router;