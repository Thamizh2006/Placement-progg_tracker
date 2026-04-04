import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  analyzeMyResume,
  autoGenerateResume,
  getMyResume,
  getResumeAnalytics,
  saveMyResume,
} from '../controllers/resumeController.js';

const router = express.Router();

router.use(protect);

router.get('/my', authorize('student'), getMyResume);
router.post('/generate', authorize('student'), autoGenerateResume);
router.put('/my', authorize('student'), saveMyResume);
router.post('/analyze', authorize('student'), analyzeMyResume);
router.get('/analytics', authorize('faculty', 'placement', 'superadmin'), getResumeAnalytics);

export default router;
