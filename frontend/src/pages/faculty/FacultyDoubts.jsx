import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const FacultyDoubts = () => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState('');
  const [responses, setResponses] = useState({});

  const loadDoubts = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/faculty/doubts');
      setDoubts(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts(true);
  }, []);

  usePolling(() => {
    loadDoubts(false);
  }, 12000, true);

  const submitResponse = async (doubtId) => {
    setRespondingId(doubtId);
    try {
      await api.put(`/faculty/doubts/${doubtId}/respond`, {
        response: responses[doubtId],
      });
      toast.success('Response submitted');
      setResponses((current) => ({ ...current, [doubtId]: '' }));
      await loadDoubts(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setRespondingId('');
    }
  };

  if (loading) {
    return <PageLoader label="Loading doubts" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Doubts</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Respond in realtime</h1>
        </div>
        <button
          onClick={() => loadDoubts(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {doubts.length === 0 && (
          <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
            No doubts assigned yet.
          </div>
        )}
        {doubts.map((doubt) => (
          <div key={doubt._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">{doubt.subject}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {doubt.student?.email} • {doubt.student?.department} • {doubt.category || 'General'}
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
            {doubt.response ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                {doubt.response}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea
                  value={responses[doubt._id] || ''}
                  onChange={(event) =>
                    setResponses((current) => ({ ...current, [doubt._id]: event.target.value }))
                  }
                  className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Write your response"
                />
                {doubt.aiSuggestion?.mentorDraft ? (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <div className="flex items-center gap-2 text-sky-700">
                      <BrainCircuit className="h-4 w-4" />
                      <p className="text-sm font-semibold">AI response draft</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {doubt.aiSuggestion.mentorDraft}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setResponses((current) => ({
                          ...current,
                          [doubt._id]: current[doubt._id] || doubt.aiSuggestion.mentorDraft,
                        }))
                      }
                      className="mt-3 rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700"
                    >
                      Use AI draft
                    </button>
                  </div>
                ) : null}
                <button
                  onClick={() => submitResponse(doubt._id)}
                  disabled={!responses[doubt._id] || respondingId === doubt._id}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {respondingId === doubt._id ? 'Submitting...' : 'Submit response'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyDoubts;
