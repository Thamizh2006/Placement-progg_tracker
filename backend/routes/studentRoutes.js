import express from 'express';
import {
  getAllFaculty,
  chooseMentor,
  getMyMentor,
  changeMentor,
  getMyProgress,
  checkEligibility,
  getStudentDashboard,
  getMentorRecommendations,
} from '../controllers/studentController.js';

import {
  updateTask,
  selectCategory,
  getMyProgress as getMyProgressData,
  checkEligibility as checkMyEligibility,
  getReadinessInsights,
} from '../controllers/progressController.js';

import {
  askDoubt,
  getDoubtAssistant,
  getMyDoubts,
  getMyDoubtThread,
} from '../controllers/doubtController.js';

import { generatePDFReport, downloadMyReport } from '../controllers/reportController.js';

import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { proofUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

// Dashboard
router.get('/dashboard', getStudentDashboard);

// Category & Progress
router.post('/select-category', selectCategory);
router.get('/my-progress', getMyProgressData);
router.get('/check-eligibility', checkMyEligibility);
router.get('/readiness-insights', getReadinessInsights);

// Task Management
router.post('/update-task', proofUpload.single('proofFile'), updateTask);

// Mentor Management
router.get('/faculty', getAllFaculty);
router.get('/mentor', getMyMentor);
router.get('/mentor-recommendations', getMentorRecommendations);
router.post('/choose-mentor', chooseMentor);
router.put('/change-mentor', changeMentor);

// Doubt/Messaging System
router.post('/doubt-assistant', getDoubtAssistant);
router.post('/ask-doubt', askDoubt);
router.get('/my-doubts', getMyDoubts);
router.get('/my-doubts/:doubtId', getMyDoubtThread);

// Report Generation
router.post('/generate-report', generatePDFReport);
router.get('/download-report', downloadMyReport);

export default router;
