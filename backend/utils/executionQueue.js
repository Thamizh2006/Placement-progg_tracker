import CodeExecutionJob from '../models/codeExecutionJobModel.js';
import Test from '../models/testModel.js';
import TestSubmission from '../models/testSubmissionModel.js';
import { executeAgainstProvider } from './executionProvider.js';

let processorStarted = false;

const calculateExecutionScore = ({ question, resultCases = [] }) => {
  const visibleCases = resultCases.filter((item) => item.visibility === 'visible');
  const hiddenCases = resultCases.filter((item) => item.visibility === 'hidden');
  const totalCases = resultCases.length;
  const passedCases = resultCases.filter((item) => item.passed).length;
  const score = totalCases ? Math.round(((question.marks || 0) * passedCases / totalCases) * 100) / 100 : 0;

  return {
    score,
    maxScore: question.marks || 0,
    passedVisibleCases: visibleCases.filter((item) => item.passed).length,
    totalVisibleCases: visibleCases.length,
    passedHiddenCases: hiddenCases.filter((item) => item.passed).length,
    totalHiddenCases: hiddenCases.length,
  };
};

const processQueuedJob = async (job) => {
  job.status = 'processing';
  job.startedAt = new Date();
  await job.save();

  try {
    const test = job.test ? await Test.findById(job.test) : null;
    const question = test?.questions?.id(job.questionId);

    if (!question) {
      throw new Error('Coding question not found for execution');
    }

    const testCases = [
      ...(question.visibleTestCases || []).map((item) => ({ ...item.toObject?.() || item, visibility: 'visible' })),
      ...(question.hiddenTestCases || []).map((item) => ({ ...item.toObject?.() || item, visibility: 'hidden' })),
    ];

    const execution = await executeAgainstProvider({
      sourceCode: job.sourceCode,
      language: job.language,
      testCases,
    });

    const scoring = calculateExecutionScore({ question, resultCases: execution.resultCases });

    job.provider = execution.provider;
    job.resultCases = execution.resultCases;
    job.executionTimeMs = execution.executionTimeMs;
    job.memoryKb = execution.memoryKb;
    job.compileOutput = execution.compileOutput;
    job.stderr = execution.stderr;
    job.stdout = execution.stdout;
    job.errorMessage = execution.errorMessage;
    job.score = scoring.score;
    job.maxScore = scoring.maxScore;
    job.passedVisibleCases = scoring.passedVisibleCases;
    job.totalVisibleCases = scoring.totalVisibleCases;
    job.passedHiddenCases = scoring.passedHiddenCases;
    job.totalHiddenCases = scoring.totalHiddenCases;
    job.status = execution.errorMessage ? 'failed' : 'completed';
    job.completedAt = new Date();
    await job.save();

    if (job.submission) {
      const submission = await TestSubmission.findById(job.submission);
      const answer = submission?.answers.find((entry) => String(entry.questionId) === String(job.questionId));
      if (answer) {
        answer.code = job.sourceCode;
        answer.language = job.language;
        answer.score = job.score;
        answer.maxScore = job.maxScore;
        answer.executionTimeMs = job.executionTimeMs;
        answer.memoryKb = job.memoryKb;
        answer.outputSummary =
          job.status === 'completed'
            ? `Passed ${job.passedVisibleCases + job.passedHiddenCases}/${job.totalVisibleCases + job.totalHiddenCases} test cases`
            : job.errorMessage || 'Execution failed';
        answer.visibleResults = job.resultCases.filter((item) => item.visibility === 'visible');
        answer.hiddenResults = job.resultCases.filter((item) => item.visibility === 'hidden');
        answer.isCorrect = job.status === 'completed' && job.score >= job.maxScore;
        answer.savedAt = new Date();
        await submission.save();
      }
    }
  } catch (error) {
    job.status = 'failed';
    job.errorMessage = error.message;
    job.completedAt = new Date();
    await job.save();
  }
};

export const startExecutionProcessor = () => {
  if (processorStarted) {
    return;
  }

  processorStarted = true;

  const intervalMs = Number(process.env.EXECUTION_QUEUE_INTERVAL_MS || 2500);
  const concurrency = Number(process.env.EXECUTION_WORKER_CONCURRENCY || 2);

  setInterval(async () => {
    const queuedJobs = await CodeExecutionJob.find({ status: 'queued' })
      .sort({ queuePriority: 1, createdAt: 1 })
      .limit(concurrency);

    await Promise.allSettled(queuedJobs.map(processQueuedJob));
  }, intervalMs);
};
