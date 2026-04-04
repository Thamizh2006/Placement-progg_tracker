import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mcq-single', 'mcq-multiple', 'coding'],
      required: true,
    },
    prompt: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: { type: [String], default: [] },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    timerSeconds: { type: Number, default: null },
    options: { type: [optionSchema], default: [] },
    correctOptionIds: { type: [String], default: [] },
    languageTemplates: {
      type: Map,
      of: String,
      default: {},
    },
    visibleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [] },
    evaluationHints: {
      requiredKeywords: { type: [String], default: [] },
      forbiddenKeywords: { type: [String], default: [] },
      referenceNotes: { type: String, default: '' },
    },
  },
  { timestamps: false }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assessmentType: {
      type: String,
      enum: ['mock_test', 'post_assessment'],
      default: 'mock_test',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorRole: { type: String, required: true },
    timeLimitMinutes: { type: Number, default: 60 },
    perQuestionTimerSeconds: { type: Number, default: null },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    allowNegativeMarking: { type: Boolean, default: false },
    instructions: { type: String, default: '' },
    assignedStudents: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    questions: { type: [questionSchema], default: [] },
    totalMarks: { type: Number, default: 0 },
    questionBankSource: {
      type: String,
      enum: ['manual', 'json', 'csv'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

const Test = mongoose.model('Test', testSchema);

export default Test;
