import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Users } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const FacultyStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/faculty/students-progress');
      setStudents(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load student progress');
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Students</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Live student progress</h1>
        </div>
        <button
          onClick={() => loadStudents(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {students.length === 0 && (
          <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
            No students are assigned to you yet.
          </div>
        )}
        {students.map((entry) => (
          <div key={entry.student._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">{entry.student.email}</p>
                  <p className="text-sm text-slate-500">
                    {entry.student.department} • {entry.student.selectedCategory || 'No category'}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {entry.eligible ? 'Eligible' : 'Needs follow-up'}
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
                <p className="text-sm text-slate-500">Last updated</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {entry.progress?.updatedAt
                    ? new Date(entry.progress.updatedAt).toLocaleString()
                    : 'No updates yet'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyStudents;
