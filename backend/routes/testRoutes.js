import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createExecutionRateLimiter } from '../middleware/executionRateLimitMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  createTest,
  createExecutionJob,
  getAssessmentAnalytics,
  getCodingProfile,
  getExecutionJob,
  getReviewQueue,
  getStudentAssessmentOverview,
  getStudentSubmissions,
  getTestById,
  getTests,
  importQuestionBank,
  evaluateAssessmentSubmission,
  saveAttemptAnswer,
  startAttempt,
  submitAttempt,
  upsertCodingProfile,
} from '../controllers/testController.js';

const router = express.Router();
const executionLimiter = createExecutionRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 12,
  message: 'Too many code execution requests. Please wait a minute and try again.',
});

router.use(protect);

router.get('/', getTests);
router.get('/analytics', authorize('faculty', 'placement', 'superadmin'), getAssessmentAnalytics);
router.get('/review-queue', authorize('faculty', 'placement', 'superadmin'), getReviewQueue);
router.get('/student/overview', authorize('student'), getStudentAssessmentOverview);
router.get('/student/submissions', authorize('student'), getStudentSubmissions);
router.get('/coding-profile', authorize('student'), getCodingProfile);
router.put('/coding-profile', authorize('student'), upsertCodingProfile);
router.get('/execution-jobs/:jobId', authorize('student'), getExecutionJob);
router.get('/:testId', getTestById);
router.post('/', authorize('faculty', 'placement', 'superadmin'), createTest);
router.post('/import', authorize('faculty', 'placement', 'superadmin'), importQuestionBank);
router.post('/:testId/start', authorize('student'), startAttempt);
router.post('/execution-jobs', authorize('student'), executionLimiter, createExecutionJob);
router.put('/submissions/:submissionId/save', authorize('student'), saveAttemptAnswer);
router.post('/submissions/:submissionId/submit', authorize('student'), submitAttempt);
router.post(
  '/submissions/:submissionId/evaluate',
  authorize('faculty', 'placement', 'superadmin'),
  evaluateAssessmentSubmission
);

export default router;
