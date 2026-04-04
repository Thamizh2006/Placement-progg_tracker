import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  BadgeCheck,
  Code2,
  PlayCircle,
  Save,
  SendHorizonal,
  TerminalSquare,
} from 'lucide-react';
import MonacoCodeEditor from '../../components/MonacoCodeEditor';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions } from '../../lib/chartSetup';
import api from '../../utils/api';

const emptyCodingPlatform = {
  username: '',
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  contests: 0,
  rating: 0,
  activityHistory: [],
};

const StudentAssessments = () => {
  const [overview, setOverview] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeAnswers, setActiveAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningQuestionId, setRunningQuestionId] = useState('');
  const [executionJobs, setExecutionJobs] = useState({});
  const [codingForm, setCodingForm] = useState({
    leetCode: emptyCodingPlatform,
    codeforces: emptyCodingPlatform,
    notes: '',
  });

  const loadOverview = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await api.get('/tests/student/overview');
      setOverview(data);
      setCodingForm({
        leetCode: { ...emptyCodingPlatform, ...(data.codingProfile?.leetCode || {}) },
        codeforces: { ...emptyCodingPlatform, ...(data.codingProfile?.codeforces || {}) },
        notes: data.codingProfile?.notes || '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(true);
  }, []);

  usePolling(() => {
    loadOverview(false).catch(() => null);
  }, 20000, true);

  const trendData = useMemo(
    () => ({
      labels: (overview?.trend || []).map((entry) => entry.testTitle),
      datasets: [
        {
          label: 'Accuracy %',
          data: (overview?.trend || []).map((entry) => entry.accuracy),
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14,165,233,0.18)',
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [overview]
  );

  const codingChartData = useMemo(
    () => ({
      labels: ['LeetCode', 'Codeforces'],
      datasets: [
        {
          label: 'Problems Solved',
          data: [
            overview?.codingProfile?.leetCode?.totalSolved || 0,
            overview?.codingProfile?.codeforces?.totalSolved || 0,
          ],
          backgroundColor: ['#10B981', '#38BDF8'],
          borderRadius: 10,
        },
      ],
    }),
    [overview]
  );

  const openTest = async (testId) => {
    try {
      const { data } = await api.get(`/tests/${testId}`);
      setSelectedTest(data);
      const latestSubmission = data.latestSubmission?.status === 'in_progress' ? data.latestSubmission : null;
      if (latestSubmission) {
        setActiveSubmission(latestSubmission);
        setActiveAnswers(
          latestSubmission.answers.reduce((map, answer) => {
            map[String(answer.questionId)] = answer;
            return map;
          }, {})
        );
      } else {
        setActiveSubmission(null);
        setActiveAnswers({});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open test');
    }
  };

  const startAttempt = async () => {
    try {
      const { data } = await api.post(`/tests/${selectedTest._id}/start`);
      setActiveSubmission(data);
      setActiveAnswers(
        data.answers.reduce((map, answer) => {
          const question = selectedTest?.questions?.find(
            (item) => String(item._id) === String(answer.questionId)
          );
          map[String(answer.questionId)] = answer;
          if (
            question?.type === 'coding' &&
            !answer.code &&
            question.languageTemplates?.[answer.language || 'python']
          ) {
            map[String(answer.questionId)] = {
              ...answer,
              code: question.languageTemplates[answer.language || 'python'],
            };
          }
          return map;
        }, {})
      );
      toast.success('Test attempt started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start attempt');
    }
  };

  const updateAnswerState = (questionId, patch) => {
    setActiveAnswers((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] || {
          questionId,
          selectedOptionIds: [],
          code: '',
          language: 'python',
          flagged: false,
        }),
        ...patch,
      },
    }));
  };

  const saveAnswer = async (questionId) => {
    if (!activeSubmission) return;
    setSaving(true);
    try {
      await api.put(`/tests/submissions/${activeSubmission._id}/save`, {
        questionId,
        ...activeAnswers[questionId],
      });
      toast.success('Answer saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  };

  const submitAttempt = async (autoSubmit = false) => {
    if (!activeSubmission) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tests/submissions/${activeSubmission._id}/submit`, {
        autoSubmit,
      });
      setActiveSubmission(data);
      toast.success(autoSubmit ? 'Time is up. Test auto-submitted.' : 'Test submitted');
      await loadOverview(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = useEffectEvent(() => {
    submitAttempt(true).catch(() => null);
  });

  useEffect(() => {
    if (!activeSubmission || !selectedTest) {
      setTimeRemaining(0);
      return;
    }

    const startedAt = new Date(activeSubmission.startedAt).getTime();
    const durationMs = (selectedTest.timeLimitMinutes || 60) * 60 * 1000;

    const tick = () => {
      const next = Math.max(0, Math.floor((startedAt + durationMs - Date.now()) / 1000));
      setTimeRemaining(next);
      if (next === 0 && activeSubmission.status === 'in_progress') {
        handleAutoSubmit();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSubmission, selectedTest]);

  const saveCodingProfile = async () => {
    try {
      const { data } = await api.put('/tests/coding-profile', codingForm);
      setOverview((current) => ({ ...current, codingProfile: data }));
      toast.success('Coding profiles updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update coding stats');
    }
  };

  const pollExecutionJob = async (jobId, questionId) => {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const { data } = await api.get(`/tests/execution-jobs/${jobId}`);
      setExecutionJobs((current) => ({ ...current, [questionId]: data }));
      if (['completed', 'failed', 'cached'].includes(data.status)) {
        setRunningQuestionId('');
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
    setRunningQuestionId('');
  };

  const runCode = async (questionId) => {
    if (!activeSubmission) return;
    setRunningQuestionId(questionId);
    try {
      const { data } = await api.post('/tests/execution-jobs', {
        submissionId: activeSubmission._id,
        questionId,
        language: activeAnswers[questionId]?.language || 'python',
        sourceCode: activeAnswers[questionId]?.code || '',
        customInput: '',
      });
      setExecutionJobs((current) => ({ ...current, [questionId]: data }));
      await pollExecutionJob(data._id, questionId);
      toast.success('Code execution finished');
    } catch (error) {
      setRunningQuestionId('');
      toast.error(error.response?.data?.message || 'Failed to run code');
    }
  };

  if (loading) {
    return <PageLoader label="Loading assessments" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_25%),linear-gradient(135deg,_#08130F_0%,_#0B1E22_45%,_#102E35_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
          <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-100">
            Post Assessment Hub
          </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Attend faculty-assigned coding assessments, run code on sample cases, and wait for faculty evaluation in one workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Each assigned assessment can be opened from here, attempted in the editor, run against sample cases, then submitted for faculty review and admin visibility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {[
              ['Readiness', `${overview?.readiness?.readinessScore || 0}%`],
              ['Test Score', `${overview?.readiness?.testReadinessScore || 0}%`],
              ['Coding Score', `${overview?.readiness?.codingReadinessScore || 0}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-3 text-4xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Assigned assessments</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Faculty post assessments</h2>
          <div className="mt-6 space-y-4">
            {(overview?.tests || []).map((test) => (
              <div key={test._id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{test.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {test.questions.length} question | {test.timeLimitMinutes} min | {test.totalMarks} marks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTest(test._id)}
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {test.latestSubmission?.status === 'in_progress'
                      ? 'Continue'
                      : test.latestSubmission
                        ? 'View'
                        : 'Attend'}
                  </button>
                </div>
                {test.latestSubmission && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      Latest attempt: {test.latestSubmission.accuracy}% auto accuracy,{' '}
                      {test.latestSubmission.totalScore}/{test.latestSubmission.maxScore}
                    </p>
                    <p className="mt-2">
                      Faculty review:{' '}
                      {test.latestSubmission.evaluationStatus === 'reviewed'
                        ? `${test.latestSubmission.finalAccuracy}% final accuracy`
                        : 'Pending'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Improvement Trend</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Score progression</h2>
          <div className="mt-6 h-80">
            <Line
              data={trendData}
              options={{
                ...baseChartOptions,
                plugins: {
                  ...baseChartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {(overview?.readiness?.suggestions || []).map((tip) => (
              <p key={tip} className="text-sm text-slate-600">
                {tip}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty review results</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Recent evaluated submissions</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(overview?.latestSubmissions || []).length === 0 && (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
              No submissions yet.
            </div>
          )}
          {(overview?.latestSubmissions || []).map((submission) => (
            <div key={submission._id} className="rounded-3xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-900">{submission.test?.title || 'Assessment'}</p>
              <p className="mt-2 text-sm text-slate-500">
                Auto score: {submission.totalScore}/{submission.maxScore}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Faculty review:{' '}
                {submission.evaluationStatus === 'reviewed'
                  ? `${submission.finalScore}/${submission.maxScore} (${submission.finalAccuracy}%)`
                  : 'Pending'}
              </p>
              {submission.evaluationFeedback ? (
                <p className="mt-3 text-sm text-slate-600">{submission.evaluationFeedback}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Code2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Coding Tracker</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Link and update coding profiles</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {['leetCode', 'codeforces'].map((platformKey) => (
              <div key={platformKey} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-lg font-semibold capitalize text-slate-900">{platformKey}</p>
                <div className="mt-4 grid gap-3">
                  {[
                    ['username', 'Username'],
                    ['totalSolved', 'Solved'],
                    ['easySolved', 'Easy'],
                    ['mediumSolved', 'Medium'],
                    ['hardSolved', 'Hard'],
                    ['contests', 'Contests'],
                    ['rating', 'Rating'],
                  ].map(([key, label]) => (
                    <input
                      key={`${platformKey}-${key}`}
                      type={key === 'username' ? 'text' : 'number'}
                      value={codingForm[platformKey][key] || ''}
                      onChange={(event) =>
                        setCodingForm((current) => ({
                          ...current,
                          [platformKey]: {
                            ...current[platformKey],
                            [key]: key === 'username' ? event.target.value : Number(event.target.value) || 0,
                          },
                        }))
                      }
                      placeholder={label}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <textarea
            value={codingForm.notes}
            onChange={(event) => setCodingForm((current) => ({ ...current, notes: event.target.value }))}
            className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Optional notes about contests, streaks, or manual sync"
          />
          <button
            type="button"
            onClick={saveCodingProfile}
            className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Save coding profile
          </button>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Coding Analytics</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Solved problem volume</h2>
          <div className="mt-6 h-80">
            <Bar
              data={codingChartData}
              options={{
                ...baseChartOptions,
                plugins: {
                  ...baseChartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
          {!overview?.executionProviderReady && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Secure execution provider is not configured yet. Add `JUDGE0_API_URL` on the backend to enable sandboxed code runs.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Coding Leaderboard</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top coding readiness in your department</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(overview?.leaderboard || []).map((entry, index) => (
            <div key={`${entry.student}-${index}`} className="rounded-3xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-900">
                #{index + 1} {entry.student}
              </p>
              <p className="mt-2 text-sm text-slate-500">Consistency {entry.consistencyScore}%</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{entry.readinessScore}%</p>
            </div>
          ))}
        </div>
      </section>

      {selectedTest && (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Attempt Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedTest.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{selectedTest.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Timer: {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
              </span>
              {!activeSubmission || activeSubmission.status !== 'in_progress' ? (
                <button
                  type="button"
                  onClick={startAttempt}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  <PlayCircle className="h-4 w-4" />
                  Start attempt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submitAttempt(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  <SendHorizonal className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit test'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {selectedTest.questions.map((question, index) => {
              const answer = activeAnswers[String(question._id)] || {};
              return (
                <div key={question._id} className="rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                        Question {index + 1} • {question.type}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{question.prompt}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {(question.tags || []).join(', ')} | {question.difficulty} | {question.marks} marks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAnswerState(String(question._id), { flagged: !answer.flagged })}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        answer.flagged ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {answer.flagged ? 'Flagged' : 'Flag for review'}
                    </button>
                  </div>

                  {question.type.startsWith('mcq') ? (
                    <div className="mt-4 grid gap-3">
                      {(question.options || []).map((option) => {
                        const selected = (answer.selectedOptionIds || []).includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${
                              selected ? 'border-sky-300 bg-sky-50' : 'border-slate-200'
                            }`}
                          >
                            <input
                              type={question.type === 'mcq-single' ? 'radio' : 'checkbox'}
                              name={`question-${question._id}`}
                              checked={selected}
                              onChange={() => {
                                const current = answer.selectedOptionIds || [];
                                const next =
                                  question.type === 'mcq-single'
                                    ? [option.id]
                                    : current.includes(option.id)
                                      ? current.filter((item) => item !== option.id)
                                      : [...current, option.id];
                                updateAnswerState(String(question._id), { selectedOptionIds: next });
                              }}
                            />
                            <span className="text-sm text-slate-700">{option.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <select
                        value={answer.language || 'python'}
                        onChange={(event) =>
                          updateAnswerState(String(question._id), {
                            language: event.target.value,
                            code:
                              answer.code ||
                              question.languageTemplates?.[event.target.value] ||
                              '',
                          })
                        }
                        className="rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                      </select>
                      <MonacoCodeEditor
                        value={answer.code || ''}
                        language={answer.language || 'python'}
                        onChange={(nextValue) => updateAnswerState(String(question._id), { code: nextValue })}
                        height={360}
                      />
                      {!!question.visibleTestCases?.length && (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">
                            Sample test cases: {question.visibleTestCases.length} | Hidden test cases:{' '}
                            {question.hiddenTestCaseCount || 0}
                          </p>
                          <div className="mt-3 space-y-3">
                            {question.visibleTestCases.map((item, testCaseIndex) => (
                              <div key={`${question._id}-visible-${testCaseIndex}`} className="rounded-2xl bg-white p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                  Sample {testCaseIndex + 1}
                                </p>
                                <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-700">
                                  Input: {item.input || '(empty)'}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-slate-700">
                                  Output: {item.expectedOutput}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => runCode(String(question._id))}
                        disabled={runningQuestionId === String(question._id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        <TerminalSquare className="h-4 w-4" />
                        {runningQuestionId === String(question._id) ? 'Running...' : 'Run code'}
                      </button>
                      {executionJobs[String(question._id)] && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">
                            Execution status: {executionJobs[String(question._id)].status}
                          </p>
                          <p className="mt-2">
                            Score: {executionJobs[String(question._id)].score}/
                            {executionJobs[String(question._id)].maxScore} | Time:{' '}
                            {executionJobs[String(question._id)].executionTimeMs} ms | Memory:{' '}
                            {executionJobs[String(question._id)].memoryKb} KB
                          </p>
                          <p className="mt-2">
                            Passed sample tests: {executionJobs[String(question._id)].passedVisibleCases}/
                            {executionJobs[String(question._id)].totalVisibleCases} | Hidden tests:{' '}
                            {executionJobs[String(question._id)].passedHiddenCases}/
                            {executionJobs[String(question._id)].totalHiddenCases}
                          </p>
                          {executionJobs[String(question._id)].errorMessage && (
                            <p className="mt-2 text-rose-600">
                              {executionJobs[String(question._id)].errorMessage}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubmission?.status === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => saveAnswer(String(question._id))}
                      disabled={saving}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save answer'}
                    </button>
                  )}

                  {activeSubmission?.status !== 'in_progress' && answer.outputSummary && (
                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                      {answer.outputSummary} | Score: {answer.score}/{answer.maxScore}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeSubmission?.status !== 'in_progress' && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty evaluation</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {activeSubmission.evaluationStatus === 'reviewed'
                  ? `Final score: ${activeSubmission.finalScore}/${activeSubmission.maxScore} (${activeSubmission.finalAccuracy}%)`
                  : 'Waiting for faculty review'}
              </p>
              {activeSubmission.evaluationFeedback ? (
                <p className="mt-3 text-sm text-slate-600">{activeSubmission.evaluationFeedback}</p>
              ) : null}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default StudentAssessments;
