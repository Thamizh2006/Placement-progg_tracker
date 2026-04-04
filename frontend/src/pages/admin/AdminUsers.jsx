import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';

const DEPARTMENTS = ['ALL', 'CSE', 'ECE', 'EEE', 'MECH', 'IT', 'ADS', 'CYBER SECURITY', 'CHEMICAL', 'BIOTECHNOLOGY'];
const ROLES = ['ALL', 'student', 'faculty', 'hod', 'placement', 'superadmin'];

const AdminUsers = () => {
  const [directory, setDirectory] = useState({ counts: [], users: [] });
  const [filters, setFilters] = useState({ role: 'ALL', department: 'ALL', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const params = {};
      if (filters.role !== 'ALL') params.role = filters.role;
      if (filters.department !== 'ALL') params.department = filters.department;
      if (filters.search.trim()) params.search = filters.search.trim();

      const { data } = await api.get('/admin/users', { params });
      setDirectory(data || { counts: [], users: [] });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [filters.department, filters.role, filters.search]);

  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  usePolling(() => {
    loadUsers(false).catch(() => null);
  }, 15000, true);

  if (loading) {
    return <PageLoader label="Loading users" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">User Directory</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage all live users by role and department</h1>
          <p className="mt-2 text-slate-600">
            Superadmin can review every student, faculty member, HOD, placement admin, and superadmin account.
          </p>
        </div>
        <button
          onClick={() => loadUsers(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {directory.counts.map((count) => (
          <div key={count.role} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{count.role}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{count.total}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_0.7fr]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Search email
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4"
                placeholder="Search user email"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Role
            <select
              value={filters.role}
              onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Department
            <select
              value={filters.department}
              onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {directory.users.map((member) => (
          <div key={member._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  {member.role === 'superadmin' ? <ShieldCheck className="h-7 w-7" /> : <Users className="h-7 w-7" />}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{member.email}</p>
                  <p className="text-sm text-slate-500">
                    {member.role} | {member.department || 'No department'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium text-slate-900">{new Date(member.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
