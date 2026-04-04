import express from 'express';
import {
  getAssignedStudents,
  getStudentProgress,
  getAllAssignedStudentsProgress,
  getAllStudents,
  getFacultyDashboard,
  getMyDoubts,
  respondToDoubt,
  getDoubtStats,
  getDoubtThread,
} from '../controllers/facultyController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('faculty'));

// Dashboard
router.get('/dashboard', getFacultyDashboard);

// Student Management
router.get('/students', getAssignedStudents);
router.get('/all-students', getAllStudents);
router.get('/students/:studentId/progress', getStudentProgress);
router.get('/students-progress', getAllAssignedStudentsProgress);

// Doubt Management
router.get('/doubts', getMyDoubts);
router.get('/doubts-stats', getDoubtStats);
router.get('/doubts/:doubtId', getDoubtThread);
router.put('/doubts/:doubtId/respond', respondToDoubt);

export default router;
