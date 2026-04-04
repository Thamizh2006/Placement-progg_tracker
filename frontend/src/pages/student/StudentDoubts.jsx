import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, MessageSquareMore, RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const StudentDoubts = () => {
  const [doubts, setDoubts] = useState([]);
  const [progress, setProgress] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantSuggestion, setAssistantSuggestion] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    taskName: '',
  });

  const availableTasks = useMemo(() => {
    if (!progress?.category?.rows) {
      return [];
    }

    return progress.category.rows.flatMap((row) =>
      row.tasks.map((task) => ({
        rowTitle: row.title,
        taskName: task,
      }))
    );
  }, [progress]);

  const loadData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [doubtsResponse, mentorResponse, progressResponse] = await Promise.all([
        api.get('/student/my-doubts'),
        api.get('/student/mentor').catch(() => ({ data: { mentor: null } })),
        api.get('/student/my-progress').catch(() => ({ data: null })),
      ]);

      setDoubts(doubtsResponse.data);
      setMentor(mentorResponse.data.mentor);
      setProgress(progressResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  usePolling(() => {
    loadData(false);
  }, 12000, true);

  useEffect(() => {
    const shouldFetchSuggestion =
      form.subject.trim().length >= 6 || form.message.trim().length >= 20;

    if (!shouldFetchSuggestion) {
      setAssistantSuggestion(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setAssistantLoading(true);
      try {
        const { data } = await api.post('/student/doubt-assistant', {
          subject: form.subject,
          message: form.message,
          taskName: form.taskName || null,
          category: progress?.progress?.category || null,
        });
        setAssistantSuggestion(data);
      } catch {
        setAssistantSuggestion(null);
      } finally {
        setAssistantLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [form.message, form.subject, form.taskName, progress]);

  const submitDoubt = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/student/ask-doubt', {
        subject: form.subject,
        message: form.message,
        taskName: form.taskName || null,
        category: progress?.progress?.category || null,
      });
      toast.success('Doubt submitted successfully');
      setForm({ subject: '', message: '', taskName: '' });
      await loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit doubt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading doubts" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Doubts</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Ask your mentor for help</h1>
          <p className="mt-2 text-slate-600">
            New doubts are routed to your current mentor and this page refreshes automatically.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitDoubt} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquareMore className="h-6 w-6 text-sky-600" />
            <h2 className="text-2xl font-semibold text-slate-900">Raise a doubt</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Mentor: {mentor?.email || 'No mentor assigned yet'}
          </p>
          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Doubt subject"
              required
            />
            <select
              value={form.taskName}
              onChange={(event) => setForm((current) => ({ ...current, taskName: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="">Link to a task (optional)</option>
              {availableTasks.map((task) => (
                <option key={`${task.rowTitle}:${task.taskName}`} value={task.taskName}>
                  {task.rowTitle} - {task.taskName}
                </option>
              ))}
            </select>
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Explain where you are stuck"
              required
            />
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <div className="flex items-center gap-2 text-sky-700">
                <BrainCircuit className="h-4 w-4" />
                <p className="text-sm font-semibold">AI doubt auto-suggestions</p>
              </div>
              {assistantLoading ? (
                <p className="mt-3 text-sm text-slate-600">Generating hints...</p>
              ) : assistantSuggestion ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-600">{assistantSuggestion.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {(assistantSuggestion.detectedTopics || []).map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {(assistantSuggestion.hints || []).map((hint) => (
                      <p key={hint} className="text-sm leading-6 text-slate-600">
                        {hint}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Start describing your issue and the assistant will suggest hints instantly.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !mentor}
              className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit doubt'}
            </button>
          </div>
        </form>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Live doubt history</h2>
          <div className="mt-6 space-y-4">
            {doubts.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                No doubts submitted yet.
              </div>
            )}
            {doubts.map((doubt) => (
              <div key={doubt._id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{doubt.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {doubt.faculty?.email || 'Mentor'} • {doubt.category || 'General'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      doubt.status === 'answered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {doubt.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{doubt.message}</p>
                {doubt.aiSuggestion?.hints?.length ? (
                  <div className="mt-4 rounded-2xl bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-700">AI starter hints</p>
                    <div className="mt-2 space-y-2">
                      {doubt.aiSuggestion.hints.slice(0, 2).map((hint) => (
                        <p key={hint} className="text-sm text-slate-700">
                          {hint}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {doubt.response && (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-700">Mentor response</p>
                    <p className="mt-2 text-sm text-emerald-900">{doubt.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDoubts;
