import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const HodFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFaculty = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/hod/faculty');
      setFaculty(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty(true);
  }, []);

  usePolling(() => {
    loadFaculty(false);
  }, 15000, true);

  if (loading) {
    return <PageLoader label="Loading faculty" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">HOD Faculty</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Department faculty capacity</h1>
        </div>
        <button
          onClick={() => loadFaculty(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {faculty.map((member) => (
          <div key={member._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="text-xl font-semibold text-slate-900">{member.email}</p>
            <p className="mt-1 text-slate-500">{member.department}</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Assigned students</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {member.assignedStudentsCount || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Eligible students</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {member.eligibleStudentsCount || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HodFaculty;
