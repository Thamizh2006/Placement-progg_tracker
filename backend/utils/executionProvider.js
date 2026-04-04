import crypto from 'crypto';

const LANGUAGE_CONFIG = {
  cpp: {
    judge0Id: 54,
    fileName: 'main.cpp',
  },
  java: {
    judge0Id: 62,
    fileName: 'Main.java',
  },
  javascript: {
    judge0Id: 63,
    fileName: 'main.js',
  },
  python: {
    judge0Id: 71,
    fileName: 'main.py',
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeOutput = (value = '') => value.replace(/\r\n/g, '\n').trim();

export const buildExecutionCacheKey = ({
  sourceCode,
  language,
  visibleTestCases = [],
  hiddenTestCases = [],
}) =>
  crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        sourceCode,
        language,
        visibleTestCases,
        hiddenTestCases,
      })
    )
    .digest('hex');

const fetchJudge0 = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(process.env.JUDGE0_API_KEY ? { 'X-RapidAPI-Key': process.env.JUDGE0_API_KEY } : {}),
    ...(process.env.JUDGE0_API_HOST ? { 'X-RapidAPI-Host': process.env.JUDGE0_API_HOST } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge0 request failed: ${response.status} ${text}`);
  }

  return response.json();
};

const resolveJudge0Url = () => process.env.JUDGE0_API_URL?.replace(/\/$/, '');

const submitJudge0Run = async ({ sourceCode, language, stdin = '' }) => {
  const baseUrl = resolveJudge0Url();
  if (!baseUrl) {
    throw new Error('Judge0 API is not configured');
  }

  const languageConfig = LANGUAGE_CONFIG[language];
  if (!languageConfig) {
    throw new Error('Unsupported execution language');
  }

  const submission = await fetchJudge0(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
    method: 'POST',
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageConfig.judge0Id,
      stdin,
      cpu_time_limit: Number(process.env.EXECUTION_CPU_TIME_LIMIT || 2),
      wall_time_limit: Number(process.env.EXECUTION_WALL_TIME_LIMIT || 5),
      memory_limit: Number(process.env.EXECUTION_MEMORY_LIMIT_KB || 128000),
      max_processes_and_or_threads: Number(process.env.EXECUTION_MAX_THREADS || 16),
      enable_per_process_and_thread_time_limit: true,
      enable_per_process_and_thread_memory_limit: true,
    }),
  });

  return submission.token;
};

const pollJudge0Result = async (token) => {
  const baseUrl = resolveJudge0Url();
  const maxAttempts = Number(process.env.EXECUTION_POLL_ATTEMPTS || 20);
  const intervalMs = Number(process.env.EXECUTION_POLL_INTERVAL_MS || 1200);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await fetchJudge0(`${baseUrl}/submissions/${token}?base64_encoded=false`);
    if (![1, 2].includes(result.status?.id)) {
      return result;
    }
    await sleep(intervalMs);
  }

  throw new Error('Execution polling timed out');
};

export const isExecutionProviderConfigured = () => Boolean(resolveJudge0Url());

export const executeAgainstProvider = async ({ sourceCode, language, testCases = [] }) => {
  if (!isExecutionProviderConfigured()) {
    return {
      provider: 'unavailable',
      resultCases: testCases.map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        passed: false,
        visibility: testCase.visibility,
        executionTimeMs: 0,
        memoryKb: 0,
        stderr: '',
        compileOutput: '',
      })),
      stdout: '',
      stderr: '',
      compileOutput: '',
      executionTimeMs: 0,
      memoryKb: 0,
      errorMessage:
        'Execution provider is not configured. Set JUDGE0_API_URL to enable secure sandbox execution.',
    };
  }

  const results = [];
  let maxExecutionTime = 0;
  let maxMemory = 0;
  let compileOutput = '';
  let stderr = '';
  let stdout = '';

  for (const testCase of testCases) {
    const token = await submitJudge0Run({
      sourceCode,
      language,
      stdin: testCase.input || '',
    });

    const result = await pollJudge0Result(token);
    const actualOutput = normalizeOutput(result.stdout || '');
    const expectedOutput = normalizeOutput(testCase.expectedOutput || '');
    const passed =
      result.status?.id === 3 &&
      actualOutput === expectedOutput;

    maxExecutionTime = Math.max(maxExecutionTime, Math.round((result.time || 0) * 1000));
    maxMemory = Math.max(maxMemory, Number(result.memory) || 0);
    compileOutput = compileOutput || result.compile_output || '';
    stderr = stderr || result.stderr || '';
    stdout = stdout || result.stdout || '';

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: result.stdout || '',
      passed,
      visibility: testCase.visibility,
      executionTimeMs: Math.round((result.time || 0) * 1000),
      memoryKb: Number(result.memory) || 0,
      stderr: result.stderr || '',
      compileOutput: result.compile_output || '',
    });
  }

  return {
    provider: 'judge0',
    resultCases: results,
    stdout,
    stderr,
    compileOutput,
    executionTimeMs: maxExecutionTime,
    memoryKb: maxMemory,
    errorMessage: '',
  };
};
