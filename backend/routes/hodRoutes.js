import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  assignStudentToFaculty,
  getHodDashboard,
  getDepartmentFaculty,
  getDepartmentStudents,
  getStudentDetails,
  getDoubtSummary,
  getFacultyAssignments,
  getDepartmentStaff,
} from '../controllers/hodController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('hod'));

// Dashboard
router.get('/dashboard', getHodDashboard);

// Faculty Management
router.get('/faculty', getDepartmentFaculty);
router.get('/staff', getDepartmentStaff);
router.get('/faculty-assignments', getFacultyAssignments);

// Student Management
router.post('/assign-mentor', assignStudentToFaculty);
router.get('/students', getDepartmentStudents);
router.get('/students/:studentId', getStudentDetails);

// Doubt Management
router.get('/doubts-summary', getDoubtSummary);

export default router;
