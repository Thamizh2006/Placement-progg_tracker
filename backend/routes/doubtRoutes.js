import express from 'express';
import {
  askDoubt,
  getMyDoubts,
  getMyDoubtById,
  getStudentDoubts,
  respondToDoubt,
  getDoubtStats,
  getDepartmentDoubts,
  getAllDoubts,
} from '../controllers/doubtController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student routes
router.post('/ask', protect, authorize('student'), askDoubt);
router.get('/my', protect, authorize('student'), getMyDoubts);
router.get('/my/:doubtId', protect, authorize('student'), getMyDoubtById);

// Faculty routes
router.get('/students', protect, authorize('faculty'), getStudentDoubts);
router.put('/respond/:doubtId', protect, authorize('faculty'), respondToDoubt);
router.get('/stats', protect, authorize('faculty'), getDoubtStats);

// HOD routes
router.get('/department', protect, authorize('hod'), getDepartmentDoubts);

// Admin/Superadmin routes
router.get('/all', protect, authorize('placement', 'superadmin'), getAllDoubts);

export default router;
