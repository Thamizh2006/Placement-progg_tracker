import CodingProfile from '../models/codingProfileModel.js';
import CodeExecutionJob from '../models/codeExecutionJobModel.js';
import Progress from '../models/progressModel.js';
import Category from '../models/categoryModel.js';
import Test from '../models/testModel.js';
import TestSubmission from '../models/testSubmissionModel.js';
import User from '../models/userModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import {
  buildAssessmentTrend,
  evaluateSubmission,
  parseQuestionBank,
  recalculateTotalMarks,
} from '../utils/assessmentEngine.js';
import { createNotification, createNotifications } from '../utils/notificationService.js';
import { buildExecutionCacheKey, isExecutionProviderConfigured } from '../utils/executionProvider.js';

const sanitizeQuestionForStudent = (question) => ({
  _id: question._id,
  type: question.type,
  prompt: question.prompt,
  difficulty: question.difficulty,
  tags: question.tags,
  marks: question.marks,
  timerSeconds: question.timerSeconds,
  options: question.options,
  languageTemplates:
    question.languageTemplates instanceof Map
      ? Object.fromEntries(question.languageTemplates)
      : question.languageTemplates || {},
  visibleTestCases: question.visibleTestCases,
  hiddenTestCaseCount: question.hiddenTestCases?.length || 0,
});

const calculateCodingReadiness = (codingProfile) => {
  const totalSolved =
    (codingProfile?.leetCode?.totalSolved || 0) + (codingProfile?.codeforces?.totalSolved || 0);
  const rating = Math.max(codingProfile?.leetCode?.rating || 0, codingProfile?.codeforces?.rating || 0);
  const contests =
    (codingProfile?.leetCode?.contests || 0) + (codingProfile?.codeforces?.contests || 0);
  const consistency =
    Math.round(
      ((codingProfile?.leetCode?.consistencyScore || 0) +
        (codingProfile?.codeforces?.consistencyScore || 0)) / 2
    ) || 0;

  return Math.min(100, Math.round(totalSolved * 0.3 + rating * 0.03 + contests * 4 + consistency * 0.4));
};

const toObjectIdStrings = (values = []) =>
  values.map((value) => String(value));

const canStudentAccessTest = (test, studentId) => {
  const assignedStudents = toObjectIdStrings(test.assignedStudents || []);
  return assignedStudents.length === 0 || assignedStudents.includes(String(studentId));
};

const ensureFacultyAssignmentScope = async ({ user, assignedStudents = [] }) => {
  if (user.role !== 'faculty') {
    return assignedStudents;
  }

  if (!assignedStudents.length) {
    const mappedStudents = await User.find({
      role: 'student',
      assignedFaculty: user._id,
    }).select('_id');

    return mappedStudents.map((student) => student._id);
  }

  const validStudents = await User.find({
    _id: { $in: assignedStudents },
    role: 'student',
    assignedFaculty: user._id,
  }).select('_id');

  return validStudents.map((student) => student._id);
};

export const createTest = async (req, res) => {
  try {
    const assessmentType = req.body.assessmentType || 'mock_test';
    const questions = (req.body.questions || []).map((question) => ({
      ...question,
      marks: Number(question.marks) || 1,
      negativeMarks: Number(question.negativeMarks) || 0,
      timerSeconds: question.timerSeconds ? Number(question.timerSeconds) : null,
    }));

    if (!questions.length) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    if (assessmentType === 'post_assessment') {
      const codingQuestions = questions.filter((question) => question.type === 'coding');
      if (!codingQuestions.length) {
        return res.status(400).json({ message: 'Post assessments must include at least one coding question' });
      }

      for (const question of codingQuestions) {
        if ((question.visibleTestCases || []).length < 2) {
          return res.status(400).json({ message: 'Each coding question needs at least 2 sample test cases' });
        }

        if ((question.hiddenTestCases || []).length < 10) {
          return res.status(400).json({ message: 'Each coding question needs at least 10 hidden test cases' });
        }
      }
    }

    const assignedStudents = await ensureFacultyAssignmentScope({
      user: req.user,
      assignedStudents: req.body.assignedStudents || [],
    });

    const test = await Test.create({
      title: req.body.title,
      description: req.body.description || '',
      assessmentType,
      createdBy: req.user._id,
      creatorRole: req.user.role,
      timeLimitMinutes: Number(req.body.timeLimitMinutes) || 60,
      perQuestionTimerSeconds: req.body.perQuestionTimerSeconds
        ? Number(req.body.perQuestionTimerSeconds)
        : null,
      status: req.body.status || 'draft',
      allowNegativeMarking: Boolean(req.body.allowNegativeMarking),
      instructions: req.body.instructions || '',
      assignedStudents,
      questions,
      totalMarks: recalculateTotalMarks(questions),
      questionBankSource: 'manual',
    });

    res.status(201).json(test);

    if (test.status === 'published' && assignedStudents.length) {
      await createNotifications(
        assignedStudents.map((studentId) => ({
          recipient: studentId,
          actor: req.user._id,
          type: 'assessment-assigned',
          title: `${test.assessmentType === 'post_assessment' ? 'Post assessment' : 'Assessment'} assigned`,
          message: `${test.title} is now available in your assessments tab.`,
          link: '/student/assessments',
          priority: 'high',
          metadata: { testId: test._id.toString(), assessmentType: test.assessmentType },
        }))
      );
    }

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'create-test',
      entityType: 'assessment-test',
      entityId: test._id.toString(),
      description: `${req.user.email} created test ${test.title}`,
      metadata: { status: test.status, questionCount: test.questions.length },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importQuestionBank = async (req, res) => {
  try {
    const { title, description, format, rawData, status, timeLimitMinutes } = req.body;
    const questions = parseQuestionBank({ format, rawData }).map((question) => ({
      ...question,
      marks: Number(question.marks) || 1,
      negativeMarks: Number(question.negativeMarks) || 0,
    }));

    const test = await Test.create({
      title,
      description: description || '',
      createdBy: req.user._id,
      creatorRole: req.user.role,
      timeLimitMinutes: Number(timeLimitMinutes) || 60,
      status: status || 'draft',
      questions,
      totalMarks: recalculateTotalMarks(questions),
      questionBankSource: format || 'json',
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to import question bank' });
  }
};

export const getTests = async (req, res) => {
  try {
    const query =
      req.user.role === 'student'
        ? { status: 'published' }
        : req.user.role === 'faculty'
          ? { $or: [{ createdBy: req.user._id }, { status: 'published' }] }
          : {};

    const tests = await Test.find(query)
      .populate('createdBy', 'email role')
      .sort({ createdAt: -1 });

    let submissions = [];
    if (req.user.role === 'student') {
      submissions = await TestSubmission.find({ student: req.user._id })
        .select(
          'test status totalScore maxScore accuracy submittedAt readinessContribution evaluationStatus finalScore finalAccuracy evaluationFeedback evaluatedAt'
        )
        .sort({ updatedAt: -1 });
    }

    const submissionMap = submissions.reduce((map, submission) => {
      map.set(String(submission.test), submission);
      return map;
    }, new Map());

    res.json(
      tests
        .filter((test) => (req.user.role === 'student' ? canStudentAccessTest(test, req.user._id) : true))
        .map((test) => ({
          ...test.toObject(),
          latestSubmission: submissionMap.get(String(test._id)) || null,
        }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).populate('createdBy', 'email role');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (req.user.role === 'student' && test.status !== 'published') {
      return res.status(403).json({ message: 'Test is not published' });
    }

    if (req.user.role === 'student' && !canStudentAccessTest(test, req.user._id)) {
      return res.status(403).json({ message: 'This assessment is not assigned to you' });
    }

    const base = test.toObject();
    if (req.user.role === 'student') {
      base.questions = base.questions.map(sanitizeQuestionForStudent);
    }

    const latestSubmission =
      req.user.role === 'student'
        ? await TestSubmission.findOne({ test: test._id, student: req.user._id }).sort({
            updatedAt: -1,
          })
        : null;

    res.json({
      ...base,
      latestSubmission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startAttempt = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test || test.status !== 'published') {
      return res.status(404).json({ message: 'Published test not found' });
    }

    if (!canStudentAccessTest(test, req.user._id)) {
      return res.status(403).json({ message: 'This assessment is not assigned to you' });
    }

    let submission = await TestSubmission.findOne({
      test: test._id,
      student: req.user._id,
      status: 'in_progress',
    }).sort({ updatedAt: -1 });

    if (!submission) {
      submission = await TestSubmission.create({
        test: test._id,
        student: req.user._id,
        startedAt: new Date(),
        answers: test.questions.map((question) => ({
          questionId: question._id,
          selectedOptionIds: [],
          code: '',
          language: 'python',
          flagged: false,
          maxScore: question.marks || 0,
        })),
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveAttemptAnswer = async (req, res) => {
  try {
    const { questionId, selectedOptionIds, code, language, flagged } = req.body;

    const submission = await TestSubmission.findOne({
      _id: req.params.submissionId,
      student: req.user._id,
      status: 'in_progress',
    });

    if (!submission) {
      return res.status(404).json({ message: 'Active submission not found' });
    }

    const existingAnswer = submission.answers.find(
      (answer) => String(answer.questionId) === String(questionId)
    );

    if (!existingAnswer) {
      return res.status(404).json({ message: 'Question answer slot not found' });
    }

    if (selectedOptionIds) existingAnswer.selectedOptionIds = selectedOptionIds;
    if (typeof code === 'string') existingAnswer.code = code;
    if (language) existingAnswer.language = language;
    if (typeof flagged === 'boolean') existingAnswer.flagged = flagged;
    existingAnswer.savedAt = new Date();

    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const submission = await TestSubmission.findOne({
      _id: req.params.submissionId,
      student: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const test = await Test.findById(submission.test);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const evaluation = evaluateSubmission({ test, submission });
    const submittedAt = new Date();

    submission.answers = evaluation.answers;
    submission.totalScore = evaluation.totalScore;
    submission.maxScore = evaluation.maxScore;
    submission.accuracy = evaluation.accuracy;
    submission.topicBreakdown = evaluation.topicBreakdown;
    submission.readinessContribution = evaluation.readinessContribution;
    submission.status = req.body.autoSubmit ? 'auto_submitted' : 'submitted';
    submission.submittedAt = submittedAt;
    submission.evaluationStatus = 'pending';
    submission.finalScore = evaluation.totalScore;
    submission.finalAccuracy = evaluation.accuracy;
    submission.evaluationFeedback = '';
    submission.evaluationNotes = '';
    submission.evaluatedBy = null;
    submission.evaluatedAt = null;
    submission.timeTakenSeconds = Math.max(
      0,
      Math.round((submittedAt.getTime() - new Date(submission.startedAt).getTime()) / 1000)
    );

    await submission.save();

    await createNotification({
      recipient: req.user._id,
      actor: req.user._id,
      type: 'report-generated',
      title: 'Assessment submitted',
      message: `${test.title} submitted with ${submission.accuracy}% accuracy.`,
      link: '/student/assessments',
      priority: submission.accuracy >= 70 ? 'medium' : 'high',
      metadata: { testId: test._id.toString(), submissionId: submission._id.toString() },
    });

    if (test.createdBy) {
      await createNotification({
        recipient: test.createdBy,
        actor: req.user._id,
        type: 'assessment-submitted',
        title: 'Student submitted post assessment',
        message: `${req.user.email} submitted ${test.title} and is ready for evaluation.`,
        link: '/faculty/assessments',
        priority: 'high',
        metadata: { testId: test._id.toString(), submissionId: submission._id.toString() },
      });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAssessmentOverview = async (req, res) => {
  try {
    const [tests, submissions, codingProfile, progress, student] = await Promise.all([
      Test.find({ status: 'published' }).sort({ createdAt: -1 }).limit(20),
      TestSubmission.find({
        student: req.user._id,
        status: { $in: ['submitted', 'auto_submitted'] },
      })
        .populate('test', 'title')
        .sort({ submittedAt: -1 }),
      CodingProfile.findOne({ student: req.user._id }),
      Progress.findOne({ student: req.user._id }),
      User.findById(req.user._id).select('department selectedCategory'),
    ]);

    const categoryDoc = progress?.category
      ? await Category.findOne({ name: progress.category })
      : null;

    const testReadinessScore = submissions.length
      ? Math.round(
          submissions.reduce((sum, submission) => sum + (submission.accuracy || 0), 0) /
            submissions.length
        )
      : 0;
    const codingReadinessScore = calculateCodingReadiness(codingProfile);
    const readinessScore = Math.min(
      100,
      Math.round(testReadinessScore * 0.6 + codingReadinessScore * 0.4)
    );

    const suggestions = [];
    if (testReadinessScore < 65) {
      suggestions.push('Retake mock tests with a focus on accuracy and flagged questions.');
    }
    if (codingReadinessScore < 60) {
      suggestions.push('Increase weekly coding consistency and update LeetCode/Codeforces stats.');
    }
    if ((progress?.progressPercentage || 0) < 75) {
      suggestions.push('Complete more roadmap tasks to convert test preparation into readiness.');
    }

    const departmentStudents = student?.department
      ? await User.find({ role: 'student', department: student.department }).select('_id email')
      : [];
    const departmentProfiles = await CodingProfile.find({
      student: { $in: departmentStudents.map((entry) => entry._id) },
    }).populate('student', 'email');

    const leaderboard = departmentProfiles
      .map((profile) => ({
        student: profile.student?.email || 'Student',
        readinessScore: profile.placementReadinessScore || 0,
        consistencyScore: profile.overallConsistencyScore || 0,
      }))
      .sort((left, right) => right.readinessScore - left.readinessScore)
      .slice(0, 8);

    res.json({
      student: {
        department: student?.department,
        selectedCategory: student?.selectedCategory,
      },
      tests: tests.filter((test) => canStudentAccessTest(test, req.user._id)),
      latestSubmissions: submissions.slice(0, 6),
      trend: await buildAssessmentTrend(req.user._id),
      codingProfile,
      categoryRows: categoryDoc?.rows || [],
      readiness: {
        testReadinessScore,
        codingReadinessScore,
        readinessScore,
        suggestions,
      },
      executionProviderReady: isExecutionProviderConfigured(),
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await TestSubmission.find({ student: req.user._id })
      .populate('test', 'title')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertCodingProfile = async (req, res) => {
  try {
    const payload = req.body || {};
    const buildPlatform = (platformData = {}) => {
      const history = (platformData.activityHistory || []).map((entry) => ({
        date: entry.date || new Date(),
        problemsSolved: Number(entry.problemsSolved) || 0,
        rating: Number(entry.rating) || 0,
        contests: Number(entry.contests) || 0,
      }));

      const consistencyScore = history.length
        ? Math.min(
            100,
            Math.round(
              history.reduce((sum, item) => sum + Math.min(item.problemsSolved, 7), 0) /
                history.length *
                10
            )
          )
        : 0;

      return {
        username: platformData.username || '',
        totalSolved: Number(platformData.totalSolved) || 0,
        easySolved: Number(platformData.easySolved) || 0,
        mediumSolved: Number(platformData.mediumSolved) || 0,
        hardSolved: Number(platformData.hardSolved) || 0,
        contests: Number(platformData.contests) || 0,
        rating: Number(platformData.rating) || 0,
        consistencyScore,
        activityHistory: history,
        lastSyncedAt: new Date(),
      };
    };

    const profile = await CodingProfile.findOneAndUpdate(
      { student: req.user._id },
      {
        student: req.user._id,
        leetCode: buildPlatform(payload.leetCode),
        codeforces: buildPlatform(payload.codeforces),
        notes: payload.notes || '',
      },
      { new: true, upsert: true }
    );

    profile.overallConsistencyScore = Math.round(
      ((profile.leetCode?.consistencyScore || 0) + (profile.codeforces?.consistencyScore || 0)) / 2
    );
    profile.placementReadinessScore = calculateCodingReadiness(profile);
    await profile.save();

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCodingProfile = async (req, res) => {
  try {
    const profile = await CodingProfile.findOne({ student: req.user._id });
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssessmentAnalytics = async (req, res) => {
  try {
    const [tests, submissions, codingProfiles] = await Promise.all([
      Test.find().populate('createdBy', 'email').sort({ createdAt: -1 }),
      TestSubmission.find({ status: { $in: ['submitted', 'auto_submitted'] } })
        .populate('student', 'email department')
        .populate('test', 'title'),
      CodingProfile.find().populate('student', 'email department'),
    ]);

    const averageAccuracy = submissions.length
      ? Math.round(
          submissions.reduce((sum, submission) => sum + (submission.accuracy || 0), 0) /
            submissions.length
        )
      : 0;

    const topStudents = submissions
      .map((submission) => ({
        student: submission.student?.email || 'Student',
        department: submission.student?.department || 'Unknown',
        testTitle: submission.test?.title || 'Assessment',
        accuracy: submission.accuracy || 0,
        score: submission.totalScore || 0,
      }))
      .sort((left, right) => right.accuracy - left.accuracy)
      .slice(0, 8);

    const codingLeaders = codingProfiles
      .map((profile) => ({
        student: profile.student?.email || 'Student',
        department: profile.student?.department || 'Unknown',
        readinessScore: profile.placementReadinessScore || 0,
        consistencyScore: profile.overallConsistencyScore || 0,
      }))
      .sort((left, right) => right.readinessScore - left.readinessScore)
      .slice(0, 8);

    res.json({
      summary: {
        totalTests: tests.length,
        totalSubmissions: submissions.length,
        averageAccuracy,
        linkedCodingProfiles: codingProfiles.length,
        pendingEvaluations: submissions.filter((submission) => submission.evaluationStatus !== 'reviewed').length,
        reviewedSubmissions: submissions.filter((submission) => submission.evaluationStatus === 'reviewed').length,
      },
      tests,
      topStudents,
      codingLeaders,
      recentEvaluations: submissions
        .filter((submission) => submission.evaluationStatus === 'reviewed')
        .map((submission) => ({
          student: submission.student?.email || 'Student',
          department: submission.student?.department || 'Unknown',
          testTitle: submission.test?.title || 'Assessment',
          finalScore: submission.finalScore || submission.totalScore || 0,
          finalAccuracy: submission.finalAccuracy || submission.accuracy || 0,
          evaluatedAt: submission.evaluatedAt || submission.updatedAt,
        }))
        .sort((left, right) => new Date(right.evaluatedAt) - new Date(left.evaluatedAt))
        .slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReviewQueue = async (req, res) => {
  try {
    const testQuery =
      req.user.role === 'faculty'
        ? { createdBy: req.user._id }
        : {};

    const ownedTests = await Test.find(testQuery).select('_id title assessmentType');
    const testIds = ownedTests.map((test) => test._id);

    const submissions = await TestSubmission.find(
      req.user.role === 'faculty' ? { test: { $in: testIds } } : {}
    )
      .populate('student', 'email department')
      .populate('test', 'title assessmentType createdBy')
      .populate('evaluatedBy', 'email role')
      .sort({ submittedAt: -1, updatedAt: -1 });

    res.json({
      pending: submissions.filter((submission) => submission.evaluationStatus !== 'reviewed'),
      reviewed: submissions.filter((submission) => submission.evaluationStatus === 'reviewed'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const evaluateAssessmentSubmission = async (req, res) => {
  try {
    const submission = await TestSubmission.findById(req.params.submissionId)
      .populate('student', 'email department')
      .populate('test', 'title createdBy');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (
      req.user.role === 'faculty' &&
      String(submission.test?.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'You can only evaluate your own assessments' });
    }

    const maxScore = submission.maxScore || 0;
    const requestedFinalScore =
      req.body.finalScore === undefined ? submission.totalScore : Number(req.body.finalScore);
    const boundedFinalScore = Math.max(0, Math.min(maxScore, requestedFinalScore || 0));

    submission.finalScore = boundedFinalScore;
    submission.finalAccuracy = maxScore ? Math.round((boundedFinalScore / maxScore) * 100) : 0;
    submission.evaluationFeedback = req.body.evaluationFeedback || '';
    submission.evaluationNotes = req.body.evaluationNotes || '';
    submission.evaluationStatus = 'reviewed';
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();
    await submission.save();

    await createNotification({
      recipient: submission.student?._id,
      actor: req.user._id,
      type: 'assessment-reviewed',
      title: 'Assessment evaluated',
      message: `${submission.test?.title || 'Your assessment'} has been reviewed by faculty.`,
      link: '/student/assessments',
      priority: 'high',
      metadata: {
        submissionId: submission._id.toString(),
        finalScore: submission.finalScore,
        finalAccuracy: submission.finalAccuracy,
      },
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExecutionJob = async (req, res) => {
  try {
    const { submissionId, questionId, language, sourceCode, customInput } = req.body;

    if (!submissionId || !questionId || !language || !sourceCode) {
      return res.status(400).json({ message: 'submissionId, questionId, language, and sourceCode are required' });
    }

    if (!['cpp', 'java', 'python', 'javascript'].includes(language)) {
      return res.status(400).json({ message: 'Unsupported execution language' });
    }

    if (sourceCode.length > 20000) {
      return res.status(400).json({ message: 'Source code exceeds allowed size' });
    }

    const submission = await TestSubmission.findOne({
      _id: submissionId,
      student: req.user._id,
      status: 'in_progress',
    });

    if (!submission) {
      return res.status(404).json({ message: 'Active submission not found' });
    }

    const test = await Test.findById(submission.test);
    const question = test?.questions?.id(questionId);

    if (!question || question.type !== 'coding') {
      return res.status(404).json({ message: 'Coding question not found' });
    }

    const cacheKey = buildExecutionCacheKey({
      sourceCode,
      language,
      visibleTestCases: question.visibleTestCases,
      hiddenTestCases: question.hiddenTestCases,
    });

    const cachedJob = await CodeExecutionJob.findOne({
      cacheKey,
      status: 'completed',
    }).sort({ completedAt: -1 });

    if (cachedJob) {
      const cloned = await CodeExecutionJob.create({
        student: req.user._id,
        test: test._id,
        submission: submission._id,
        questionId: question._id,
        language,
        sourceCode,
        stdin: customInput || '',
        customInput: customInput || '',
        status: 'cached',
        provider: cachedJob.provider,
        cacheKey,
        executionTimeMs: cachedJob.executionTimeMs,
        memoryKb: cachedJob.memoryKb,
        compileOutput: cachedJob.compileOutput,
        stderr: cachedJob.stderr,
        stdout: cachedJob.stdout,
        score: cachedJob.score,
        maxScore: cachedJob.maxScore,
        passedVisibleCases: cachedJob.passedVisibleCases,
        totalVisibleCases: cachedJob.totalVisibleCases,
        passedHiddenCases: cachedJob.passedHiddenCases,
        totalHiddenCases: cachedJob.totalHiddenCases,
        resultCases: cachedJob.resultCases,
        completedAt: new Date(),
      });

      return res.status(201).json(cloned);
    }

    const job = await CodeExecutionJob.create({
      student: req.user._id,
      test: test._id,
      submission: submission._id,
      questionId: question._id,
      language,
      sourceCode,
      stdin: customInput || '',
      customInput: customInput || '',
      status: 'queued',
      provider: isExecutionProviderConfigured() ? 'judge0' : 'unavailable',
      cacheKey,
      maxScore: question.marks || 0,
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExecutionJob = async (req, res) => {
  try {
    const job = await CodeExecutionJob.findOne({
      _id: req.params.jobId,
      student: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: 'Execution job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
