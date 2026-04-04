import mongoose from 'mongoose';

const testCaseResultSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    actualOutput: { type: String, default: '' },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedOptionIds: { type: [String], default: [] },
    code: { type: String, default: '' },
    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript'],
      default: 'python',
    },
    flagged: { type: Boolean, default: false },
    savedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    outputSummary: { type: String, default: '' },
    visibleResults: { type: [testCaseResultSchema], default: [] },
    hiddenResults: { type: [testCaseResultSchema], default: [] },
  },
  { _id: false }
);

const topicBreakdownSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

const testSubmissionSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted'],
      default: 'in_progress',
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    topicBreakdown: { type: [topicBreakdownSchema], default: [] },
    readinessContribution: { type: Number, default: 0 },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
    },
    finalScore: { type: Number, default: 0 },
    finalAccuracy: { type: Number, default: 0 },
    evaluationFeedback: { type: String, default: '' },
    evaluationNotes: { type: String, default: '' },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

testSubmissionSchema.index({ test: 1, student: 1, startedAt: -1 });

const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);

export default TestSubmission;
