import express from 'express';
import {
  getCategories,
  selectCategory,
  updateTask,
  getMyProgress,
  getAllStudentProgress,
  checkEligibility,
} from '../controllers/progressController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/categories', protect, authorize('student'), getCategories);

router.post('/select', protect, authorize('student'), selectCategory);

router.post('/update-task', protect, authorize('student'), updateTask);

router.get('/my-progress', protect, authorize('student'), getMyProgress);

router.get('/all-progress', protect, authorize('faculty', 'admin'), getAllStudentProgress);

router.get('/check-eligibility', protect, authorize('student'), checkEligibility);

export default router;
