import { Router } from 'express';
import { announcementController } from './announcement.controller.js';
import { validate } from '../../core/validation/validate.middleware.js';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcement.validation.js';
import { authenticate } from '../../core/permissions/authenticate.middleware.js';
import { authorize } from '../../core/permissions/authorize.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('view-announcements'), announcementController.list);
router.get('/unread-count', authorize('view-announcements'), announcementController.getUnreadCount);
router.get('/:id', authorize('view-announcements'), announcementController.getById);
router.post('/', authorize('manage-announcements'), validate(createAnnouncementSchema), announcementController.create);
router.put('/:id', authorize('manage-announcements'), validate(updateAnnouncementSchema), announcementController.update);
router.delete('/:id', authorize('manage-announcements'), announcementController.delete);
router.post('/:id/read', authorize('view-announcements'), announcementController.markAsRead);
router.post('/expire-old', authorize('manage-announcements'), announcementController.expireOld);
router.post('/process-scheduled', authorize('manage-announcements'), announcementController.processScheduled);

export default router;
