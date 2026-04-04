import { useCallback, useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw, Shield, TimerReset } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';

const settingCards = [
  {
    title: 'Authentication Policy',
    detail: 'Strong passwords are enforced with uppercase, lowercase, number, and minimum length rules.',
    icon: LockKeyhole,
  },
  {
    title: 'Role Protection',
    detail: 'Protected routes restrict access by user role before pages and APIs are available.',
    icon: Shield,
  },
  {
    title: 'Realtime Refresh',
    detail: 'Dashboards and operational pages poll backend data regularly to keep decisions current.',
    icon: TimerReset,
  },
];

const AdminSettings = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSettings = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/admin/overview');
      setOverview(data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load settings context.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings(true);
  }, [loadSettings]);

  usePolling(() => {
    loadSettings(false).catch(() => null);
  }, 20000, true);

  if (loading) {
    return <PageLoader label="Loading settings" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">System Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Live platform posture and operating defaults</h1>
          <p className="mt-2 text-slate-600">
            This page summarizes the active operational posture instead of an empty placeholder, while keeping the UI unchanged.
          </p>
        </div>
        <button
          onClick={() => loadSettings(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-3">
        {settingCards.map((card) => (
          <div key={card.title} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 w-fit">
              <card.icon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-xl font-semibold text-slate-900">{card.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Realtime Snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Current operating values</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Managed roles</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{overview?.access?.manageableRoles?.join(', ') || '-'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending doubts</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.summary?.pendingDoubts || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Reports generated</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.summary?.reportsGenerated || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Average progress</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.summary?.averageProgress || 0}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Operational Notes</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Realtime use cases</h2>
          <div className="mt-6 space-y-4">
            {[
              'Monitor platform readiness before major company drives.',
              'Check active doubt backlog before assigning more mentors.',
              'Confirm role coverage across departments before semester placement events.',
              'Use superadmin analytics and PDF exports for reporting reviews.',
            ].map((note) => (
              <div key={note} className="rounded-3xl border border-slate-100 p-4 text-sm text-slate-600">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
