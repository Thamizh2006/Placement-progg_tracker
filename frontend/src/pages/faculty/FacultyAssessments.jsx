import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, FileCode2, Users } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';

const createTestCase = () => ({ input: '', expectedOutput: '' });

const createCodingQuestion = () => ({
  type: 'coding',
  prompt: '',
  difficulty: 'medium',
  tags: ['post-assessment'],
  marks: 100,
  negativeMarks: 0,
  visibleTestCases: [createTestCase(), createTestCase()],
  hiddenTestCases: Array.from({ length: 10 }, createTestCase),
  languageTemplates: {
    python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n',
    java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n    }\n}\n',
    javascript: 'function solve() {\n}\n\nsolve();\n',
  },
  evaluationHints: {
    requiredKeywords: [],
    forbiddenKeywords: [],
    referenceNotes: '',
  },
});

const FacultyAssessments = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviewQueue, setReviewQueue] = useState({ pending: [], reviewed: [] });
  const [students, setStudents] = useState([]);
  const [evaluationDrafts, setEvaluationDrafts] = useState({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions:
      'Solve the coding problem in the editor below. You can run your code on sample test cases and then submit for faculty evaluation.',
    timeLimitMinutes: 60,
    status: 'published',
    selectedStudentIds: [],
    question: createCodingQuestion(),
  });

  const loadData = async () => {
    const [testsResponse, analyticsResponse, reviewsResponse, studentsResponse] = await Promise.all([
      api.get('/tests'),
      api.get('/tests/analytics'),
      api.get('/tests/review-queue'),
      api.get('/faculty/students'),
    ]);

    setTests((testsResponse.data || []).filter((test) => test.assessmentType === 'post_assessment'));
    setAnalytics(analyticsResponse.data);
    setReviewQueue(reviewsResponse.data);
    setStudents(studentsResponse.data || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load faculty assessments');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (students.length && form.selectedStudentIds.length === 0) {
      setForm((current) => ({
        ...current,
        selectedStudentIds: students.map((student) => student._id),
      }));
    }
  }, [students, form.selectedStudentIds.length]);

  const updateCase = (collection, index, field, value) => {
    setForm((current) => ({
      ...current,
      question: {
        ...current.question,
        [collection]: current.question[collection].map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const createAssessment = async () => {
    setSaving(true);
    try {
      await api.post('/tests', {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        assessmentType: 'post_assessment',
        timeLimitMinutes: form.timeLimitMinutes,
        status: form.status,
        assignedStudents: form.selectedStudentIds,
        questions: [
          {
            ...form.question,
            tags:
              typeof form.question.tags === 'string'
                ? form.question.tags.split(',').map((item) => item.trim()).filter(Boolean)
                : form.question.tags,
          },
        ],
      });

      toast.success('Post assessment assigned successfully');
      setForm({
        title: '',
        description: '',
        instructions:
          'Solve the coding problem in the editor below. You can run your code on sample test cases and then submit for faculty evaluation.',
        timeLimitMinutes: 60,
        status: 'published',
        selectedStudentIds: students.map((student) => student._id),
        question: createCodingQuestion(),
      });
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post assessment');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (studentId) => {
    setForm((current) => ({
      ...current,
      selectedStudentIds: current.selectedStudentIds.includes(studentId)
        ? current.selectedStudentIds.filter((id) => id !== studentId)
        : [...current.selectedStudentIds, studentId],
    }));
  };

  const submitEvaluation = async (submissionId, currentScore) => {
    const draft = evaluationDrafts[submissionId] || {};

    try {
      await api.post(`/tests/submissions/${submissionId}/evaluate`, {
        finalScore: draft.finalScore === undefined ? currentScore : Number(draft.finalScore),
        evaluationFeedback: draft.evaluationFeedback || '',
        evaluationNotes: draft.evaluationNotes || '',
      });
      toast.success('Assessment evaluated');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save evaluation');
    }
  };

  if (loading) {
    return <PageLoader label="Loading faculty assessments" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_24%),linear-gradient(135deg,_#08130F_0%,_#0C1D1E_46%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-100">
              Daily Post Assessment
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Assign coding assessments, review student submissions, and push evaluated results into admin visibility.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              This workflow supports Python, Java, C++, and JavaScript with 2 sample test cases, 10 hidden test cases, student code runs, and faculty evaluation after submission.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {[
              ['Assigned Students', students.length],
              ['Pending Reviews', reviewQueue.pending?.length || 0],
              ['Reviewed', reviewQueue.reviewed?.length || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-3 text-4xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileCode2 className="h-6 w-6 text-sky-600" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Builder</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Create post assessment</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="input-field"
              placeholder="Daily post assessment title"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="input-field min-h-24"
              placeholder="Assessment description"
            />
            <textarea
              value={form.question.prompt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  question: { ...current.question, prompt: event.target.value },
                }))
              }
              className="input-field min-h-32"
              placeholder="Write the coding problem statement"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="number"
                value={form.timeLimitMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timeLimitMinutes: Number(event.target.value) || 60,
                  }))
                }
                className="input-field"
                placeholder="Time limit"
              />
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <input
                value={Array.isArray(form.question.tags) ? form.question.tags.join(', ') : form.question.tags}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    question: { ...current.question, tags: event.target.value },
                  }))
                }
                className="input-field"
                placeholder="Tags"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-slate-900">
                <Users className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Assign students</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {students.map((student) => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedStudentIds.includes(student._id)}
                      onChange={() => toggleStudent(student._id)}
                    />
                    <span>{student.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">2 sample test cases</p>
                <div className="mt-4 space-y-3">
                  {form.question.visibleTestCases.map((testCase, index) => (
                    <div key={`visible-${index}`} className="grid gap-3">
                      <textarea
                        value={testCase.input}
                        onChange={(event) => updateCase('visibleTestCases', index, 'input', event.target.value)}
                        className="input-field min-h-20 font-mono text-sm"
                        placeholder={`Sample input ${index + 1}`}
                      />
                      <textarea
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          updateCase('visibleTestCases', index, 'expectedOutput', event.target.value)
                        }
                        className="input-field min-h-20 font-mono text-sm"
                        placeholder={`Expected output ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">10 hidden test cases</p>
                <div className="mt-4 grid gap-3">
                  {form.question.hiddenTestCases.map((testCase, index) => (
                    <div key={`hidden-${index}`} className="grid gap-3 md:grid-cols-2">
                      <input
                        value={testCase.input}
                        onChange={(event) => updateCase('hiddenTestCases', index, 'input', event.target.value)}
                        className="input-field font-mono text-sm"
                        placeholder={`Hidden input ${index + 1}`}
                      />
                      <input
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          updateCase('hiddenTestCases', index, 'expectedOutput', event.target.value)
                        }
                        className="input-field font-mono text-sm"
                        placeholder={`Expected output ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={createAssessment}
              disabled={saving || !form.selectedStudentIds.length}
              className="primary-button"
            >
              {saving ? 'Assigning assessment...' : 'Assign post assessment'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Published assessments</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recent assignments</h2>
            <div className="mt-6 space-y-3">
              {tests.slice(0, 6).map((test) => (
                <div key={test._id} className="rounded-3xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{test.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {test.status} | {test.timeLimitMinutes} min | {test.assignedStudents?.length || 0} students
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Analytics</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Assessment performance</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total tests</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {analytics?.summary?.totalTests || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Average accuracy</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {analytics?.summary?.averageAccuracy || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty evaluation</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Pending reviews</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {(reviewQueue.pending || []).length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                No pending submissions right now.
              </div>
            )}
            {(reviewQueue.pending || []).map((submission) => {
              const draft = evaluationDrafts[submission._id] || {};
              return (
                <div key={submission._id} className="rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{submission.test?.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {submission.student?.email} | {submission.student?.department || 'Unknown department'}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending review
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    Auto score: {submission.totalScore}/{submission.maxScore} | Auto accuracy:{' '}
                    {submission.accuracy}%
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      type="number"
                      value={draft.finalScore ?? submission.totalScore}
                      onChange={(event) =>
                        setEvaluationDrafts((current) => ({
                          ...current,
                          [submission._id]: {
                            ...current[submission._id],
                            finalScore: event.target.value,
                          },
                        }))
                      }
                      className="input-field"
                      placeholder="Final score"
                    />
                    <textarea
                      value={draft.evaluationFeedback || ''}
                      onChange={(event) =>
                        setEvaluationDrafts((current) => ({
                          ...current,
                          [submission._id]: {
                            ...current[submission._id],
                            evaluationFeedback: event.target.value,
                          },
                        }))
                      }
                      className="input-field min-h-24"
                      placeholder="Feedback for student"
                    />
                    <textarea
                      value={draft.evaluationNotes || ''}
                      onChange={(event) =>
                        setEvaluationDrafts((current) => ({
                          ...current,
                          [submission._id]: {
                            ...current[submission._id],
                            evaluationNotes: event.target.value,
                          },
                        }))
                      }
                      className="input-field min-h-24"
                      placeholder="Internal evaluation notes"
                    />
                    <button
                      type="button"
                      onClick={() => submitEvaluation(submission._id, submission.totalScore)}
                      className="primary-button w-fit"
                    >
                      Evaluate submission
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Reviewed submissions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Completed evaluations</h2>
          <div className="mt-6 space-y-4">
            {(reviewQueue.reviewed || []).length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                Reviewed assessments will appear here.
              </div>
            )}
            {(reviewQueue.reviewed || []).slice(0, 8).map((submission) => (
              <div key={submission._id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{submission.student?.email}</p>
                    <p className="text-sm text-slate-500">{submission.test?.title}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Reviewed
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Final score: {submission.finalScore}/{submission.maxScore} | Final accuracy:{' '}
                  {submission.finalAccuracy}%
                </p>
                {submission.evaluationFeedback ? (
                  <p className="mt-2 text-sm text-slate-600">{submission.evaluationFeedback}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyAssessments;
