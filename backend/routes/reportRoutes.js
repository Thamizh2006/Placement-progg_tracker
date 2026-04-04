import express from 'express';
import {
  generateProgressReport,
  getMyReports,
  getLatestReport,
  getStudentReport,
  getAllReports,
  generateBulkReports,
  getDepartmentReports,
  getCrossDepartmentAnalytics,
} from '../controllers/reportController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student routes
router.post('/generate', protect, authorize('student'), generateProgressReport);
router.get('/my', protect, authorize('student'), getMyReports);
router.get('/latest', protect, authorize('student'), getLatestReport);

// Faculty routes
router.get('/student/:studentId', protect, authorize('faculty'), getStudentReport);

// Admin/Placement routes
router.get('/all', protect, authorize('placement', 'superadmin'), getAllReports);
router.post('/bulk', protect, authorize('placement', 'superadmin'), generateBulkReports);

// HOD routes
router.get('/department', protect, authorize('hod'), getDepartmentReports);

// Superadmin routes
router.get('/analytics', protect, authorize('superadmin'), getCrossDepartmentAnalytics);

export default router;
