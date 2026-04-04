import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Users } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';

const roleCapabilities = {
  student: ['Track progress', 'Ask mentor doubts', 'Generate personal reports', 'View forum updates'],
  faculty: ['Mentor assigned students', 'Answer doubts', 'View student progress', 'Post forum announcements'],
  hod: ['See department analytics', 'Monitor faculty performance', 'Assign mentors', 'Download department PDFs'],
  placement: ['Manage students/faculty/HODs', 'Review system reports', 'Post placement notices', 'Monitor analytics'],
  superadmin: ['Manage every role', 'View all departments', 'Download global PDFs', 'Access full analytics and settings'],
};

const AdminRoles = () => {
  const [overview, setOverview] = useState(null);
  const [directory, setDirectory] = useState({ counts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoles = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [overviewResponse, directoryResponse] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
      ]);
      setOverview(overviewResponse.data || null);
      setDirectory(directoryResponse.data || { counts: [] });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load role data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles(true);
  }, [loadRoles]);

  usePolling(() => {
    loadRoles(false).catch(() => null);
  }, 15000, true);

  if (loading) {
    return <PageLoader label="Loading roles" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Live role matrix and access review</h1>
          <p className="mt-2 text-slate-600">
            This page now shows active role coverage and realtime permission context instead of an empty screen.
          </p>
        </div>
        <button
          onClick={() => loadRoles(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {directory.counts.map((count) => (
          <div key={count.role} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{count.role}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{count.total}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        {Object.entries(roleCapabilities).map(([role, capabilities]) => (
          <div key={role} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  {role === 'superadmin' ? <ShieldCheck className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-xl font-semibold capitalize text-slate-900">{role}</p>
                  <p className="text-sm text-slate-500">
                    {overview?.access?.manageableRoles?.includes(role) ? 'Managed by this signed-in account' : 'Visible in system matrix'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {capabilities.map((capability) => (
                <span key={capability} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  {capability}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRoles;
