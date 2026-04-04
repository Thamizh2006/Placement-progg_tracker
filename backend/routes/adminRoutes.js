import express from 'express';
import {
  createAdminUser,
  getFilteredStudents,
  getAllFaculty,
  getAllStudents,
  deleteFaculty,
  getAdminDashboard,
  getAdminOverview,
  getDetailedReports,
  getDepartmentStats,
  getAllHods,
  getDoubtStatistics,
  assignStudentToFaculty,
  getUserDirectory,
} from '../controllers/adminController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

/* ===========================
   OVERVIEW
=========================== */
router.get('/overview', authorize('superadmin', 'placement'), getAdminOverview);

/* ===========================
   DASHBOARD
=========================== */
router.get('/dashboard', authorize('superadmin', 'placement'), getAdminDashboard);

/* ===========================
   USER DIRECTORY + CREATION
=========================== */
router
  .route('/users')
  .get(authorize('superadmin', 'placement'), getUserDirectory)
  .post(authorize('superadmin', 'placement'), createAdminUser);

/* ===========================
   FILTERED STUDENTS
=========================== */
router.get(
  '/students',
  authorize('hod', 'faculty', 'placement', 'superadmin'),
  getFilteredStudents
);

/* ===========================
   ALL STUDENTS (FULL ACCESS)
=========================== */
router.get('/all-students', authorize('superadmin'), getAllStudents);

/* ===========================
   GET ALL FACULTY
=========================== */
router.get('/faculty', authorize('superadmin', 'placement'), getAllFaculty);

/* ===========================
   DELETE FACULTY
=========================== */
router.delete('/faculty/:facultyId', authorize('superadmin'), deleteFaculty);

/* ===========================
   ASSIGN STUDENT TO FACULTY
=========================== */
router.post('/assign-student', authorize('superadmin', 'placement', 'hod'), assignStudentToFaculty);

/* ===========================
   GET ALL HODS
=========================== */
router.get('/hods', authorize('superadmin'), getAllHods);

/* ===========================
   DETAILED REPORTS
=========================== */
router.get('/reports', authorize('placement', 'superadmin'), getDetailedReports);

/* ===========================
   DEPARTMENT STATS
=========================== */
router.get('/department-stats', authorize('placement', 'superadmin'), getDepartmentStats);

/* ===========================
   DOUBT STATISTICS
=========================== */
router.get('/doubts-stats', authorize('placement', 'superadmin'), getDoubtStatistics);

export default router;
