import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const HodStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/hod/students');
      setStudents(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(true);
  }, []);

  usePolling(() => {
    loadStudents(false);
  }, 12000, true);

  if (loading) {
    return <PageLoader label="Loading students" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Department Students</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Realtime student readiness</h1>
        </div>
        <button
          onClick={() => loadStudents(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {students.map((entry) => (
          <div key={entry.student._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">{entry.student.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {entry.student.selectedCategory || 'No category'} • Mentor:{' '}
                  {entry.student.assignedFaculty?.email || 'Unassigned'}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {entry.eligible ? 'Eligible' : 'At risk'}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {entry.progress?.progressPercentage || 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Completed tasks</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {entry.progress?.completedTasks?.length || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Updated</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {entry.progress?.updatedAt
                    ? new Date(entry.progress.updatedAt).toLocaleString()
                    : 'No updates'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HodStudents;
