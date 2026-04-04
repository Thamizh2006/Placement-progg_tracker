import mongoose from 'mongoose';

const executionCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    stderr: { type: String, default: '' },
    compileOutput: { type: String, default: '' },
  },
  { _id: false }
);

const codeExecutionJobSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      default: null,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSubmission',
      default: null,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript'],
      required: true,
    },
    sourceCode: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    stdin: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    customInput: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'cached'],
      default: 'queued',
      index: true,
    },
    provider: {
      type: String,
      enum: ['judge0', 'docker', 'unavailable'],
      default: 'judge0',
    },
    queuePriority: {
      type: Number,
      default: 5,
    },
    cacheKey: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      default: null,
    },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    compileOutput: { type: String, default: '' },
    stderr: { type: String, default: '' },
    stdout: { type: String, default: '' },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    passedVisibleCases: { type: Number, default: 0 },
    totalVisibleCases: { type: Number, default: 0 },
    passedHiddenCases: { type: Number, default: 0 },
    totalHiddenCases: { type: Number, default: 0 },
    resultCases: { type: [executionCaseSchema], default: [] },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

codeExecutionJobSchema.index({ cacheKey: 1, status: 1 });
codeExecutionJobSchema.index({ student: 1, createdAt: -1 });

const CodeExecutionJob = mongoose.model('CodeExecutionJob', codeExecutionJobSchema);

export default CodeExecutionJob;
