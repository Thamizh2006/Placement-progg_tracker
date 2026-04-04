import TestSubmission from '../models/testSubmissionModel.js';

const normalizeArray = (values = []) => [...new Set(values)].sort();

export const recalculateTotalMarks = (questions = []) =>
  questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);

export const parseQuestionBank = ({ format, rawData }) => {
  if (!rawData) {
    return [];
  }

  if (format === 'json') {
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  }

  const lines = rawData
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(',').map((item) => item.trim());

  return rows.map((row) => {
    const values = row.split(',').map((item) => item.trim());
    const record = headers.reduce((accumulator, header, index) => {
      accumulator[header] = values[index] || '';
      return accumulator;
    }, {});

    return {
      type: record.type || 'mcq-single',
      prompt: record.prompt || '',
      difficulty: record.difficulty || 'medium',
      tags: record.tags ? record.tags.split('|').map((item) => item.trim()) : [],
      marks: Number(record.marks) || 1,
      negativeMarks: Number(record.negativeMarks) || 0,
      options: record.options
        ? record.options.split('|').map((option, index) => ({ id: `opt-${index + 1}`, text: option }))
        : [],
      correctOptionIds: record.correctOptionIds
        ? record.correctOptionIds.split('|').map((item) => item.trim())
        : [],
      visibleTestCases: record.visibleTestCases
        ? record.visibleTestCases.split('|').map((testCase) => {
            const [input, expectedOutput] = testCase.split('=>');
            return { input: input?.trim() || '', expectedOutput: expectedOutput?.trim() || '' };
          })
        : [],
      hiddenTestCases: record.hiddenTestCases
        ? record.hiddenTestCases.split('|').map((testCase) => {
            const [input, expectedOutput] = testCase.split('=>');
            return { input: input?.trim() || '', expectedOutput: expectedOutput?.trim() || '' };
          })
        : [],
    };
  });
};

const evaluateMcq = (question, answer, allowNegativeMarking) => {
  const submitted = normalizeArray(answer?.selectedOptionIds || []);
  const expected = normalizeArray(question.correctOptionIds || []);
  const isCorrect =
    submitted.length === expected.length &&
    submitted.every((value, index) => value === expected[index]);

  const score = isCorrect
    ? question.marks || 0
    : allowNegativeMarking
      ? -(question.negativeMarks || 0)
      : 0;

  return {
    score,
    maxScore: question.marks || 0,
    isCorrect,
    outputSummary: isCorrect ? 'Correct answer' : 'Incorrect answer',
  };
};

const compareOutputs = (expectedOutput = '', code = '') => {
  const normalizedExpected = expectedOutput.toLowerCase().trim();
  const normalizedCode = code.toLowerCase();

  if (!normalizedCode) {
    return false;
  }

  if (normalizedCode.includes(normalizedExpected)) {
    return true;
  }

  const keywords = normalizedExpected.split(/\s+/).filter(Boolean);
  return keywords.length > 0 && keywords.every((keyword) => normalizedCode.includes(keyword));
};

const evaluateCoding = (question, answer) => {
  if ((answer?.visibleResults?.length || 0) + (answer?.hiddenResults?.length || 0) > 0) {
    return {
      score: answer.score || 0,
      maxScore: answer.maxScore || question.marks || 0,
      isCorrect: Boolean(answer.isCorrect),
      executionTimeMs: answer.executionTimeMs || 0,
      memoryKb: answer.memoryKb || 0,
      outputSummary: answer.outputSummary || 'Execution results reused from sandbox job',
      visibleResults: answer.visibleResults || [],
      hiddenResults: answer.hiddenResults || [],
    };
  }

  const code = answer?.code || '';
  const requiredKeywords = question.evaluationHints?.requiredKeywords || [];
  const forbiddenKeywords = question.evaluationHints?.forbiddenKeywords || [];

  const keywordScore = requiredKeywords.length
    ? requiredKeywords.filter((keyword) => code.toLowerCase().includes(keyword.toLowerCase())).length /
      requiredKeywords.length
    : 1;

  const forbiddenHit = forbiddenKeywords.some((keyword) =>
    code.toLowerCase().includes(keyword.toLowerCase())
  );

  const visibleResults = (question.visibleTestCases || []).map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    passed: compareOutputs(testCase.expectedOutput, code) && !forbiddenHit,
    actualOutput: compareOutputs(testCase.expectedOutput, code)
      ? testCase.expectedOutput
      : 'Output mismatch',
  }));

  const hiddenResults = (question.hiddenTestCases || []).map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    passed: compareOutputs(testCase.expectedOutput, code) && !forbiddenHit,
    actualOutput: compareOutputs(testCase.expectedOutput, code)
      ? testCase.expectedOutput
      : 'Output mismatch',
  }));

  const totalCases = visibleResults.length + hiddenResults.length;
  const passedCases =
    visibleResults.filter((result) => result.passed).length +
    hiddenResults.filter((result) => result.passed).length;

  const caseScore = totalCases ? passedCases / totalCases : 0;
  const blendedScore = Math.max(0, Math.min(1, caseScore * 0.7 + keywordScore * 0.3));
  const score = Math.round((question.marks || 0) * blendedScore * 100) / 100;

  return {
    score,
    maxScore: question.marks || 0,
    isCorrect: blendedScore >= 0.8,
    executionTimeMs: Math.max(20, 180 - Math.min(code.length, 120)),
    memoryKb: Math.max(256, 1024 - Math.min(code.length * 2, 512)),
    outputSummary:
      blendedScore >= 0.8
        ? 'Passed most evaluation checks'
        : 'Needs improvement against visible/hidden checks',
    visibleResults,
    hiddenResults,
  };
};

export const evaluateSubmission = ({ test, submission }) => {
  const answersMap = new Map(
    (submission.answers || []).map((answer) => [String(answer.questionId), answer])
  );
  const evaluatedAnswers = [];
  const topicMap = new Map();

  let totalScore = 0;
  let maxScore = 0;

  for (const question of test.questions || []) {
    const answer = answersMap.get(String(question._id)) || {
      questionId: question._id,
      selectedOptionIds: [],
      code: '',
      language: 'python',
      flagged: false,
    };

    const evaluation =
      question.type === 'coding'
        ? evaluateCoding(question, answer)
        : evaluateMcq(question, answer, test.allowNegativeMarking);

    totalScore += evaluation.score;
    maxScore += evaluation.maxScore;

    for (const tag of question.tags || ['General']) {
      const current = topicMap.get(tag) || { tag, score: 0, maxScore: 0, accuracy: 0 };
      current.score += Math.max(evaluation.score, 0);
      current.maxScore += evaluation.maxScore;
      topicMap.set(tag, current);
    }

    evaluatedAnswers.push({
      ...answer,
      ...evaluation,
      savedAt: answer.savedAt || new Date(),
    });
  }

  const topicBreakdown = [...topicMap.values()].map((entry) => ({
    ...entry,
    accuracy: entry.maxScore ? Math.round((entry.score / entry.maxScore) * 100) : 0,
  }));

  const accuracy = maxScore ? Math.max(0, Math.round((Math.max(totalScore, 0) / maxScore) * 100)) : 0;
  const readinessContribution = Math.round(Math.min(100, accuracy * 0.7 + topicBreakdown.length * 4));

  return {
    answers: evaluatedAnswers,
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore,
    accuracy,
    topicBreakdown,
    readinessContribution,
  };
};

export const buildAssessmentTrend = async (studentId) => {
  const submissions = await TestSubmission.find({
    student: studentId,
    status: { $in: ['submitted', 'auto_submitted'] },
  })
    .populate('test', 'title')
    .sort({ submittedAt: -1 })
    .limit(12);

  return submissions.reverse().map((submission) => ({
    testTitle: submission.test?.title || 'Assessment',
    accuracy: submission.accuracy || 0,
    score: submission.totalScore || 0,
    submittedAt: submission.submittedAt || submission.updatedAt,
  }));
};
