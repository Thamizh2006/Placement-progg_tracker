import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  getActivityFeed,
  getMyNotifications,
  markNotificationRead,
} from '../controllers/activityController.js';

const router = express.Router();

router.use(protect);

router.get('/feed', getActivityFeed);
router.get('/notifications', getMyNotifications);
router.put('/notifications/:notificationId/read', markNotificationRead);

export default router;
