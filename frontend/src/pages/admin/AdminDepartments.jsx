import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Building2, RefreshCw, Users } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';

const CATEGORY_LABELS = {
  '5lpa': 'Up to 5 LPA',
  '7lpa': 'Up to 7 LPA',
  '10lpa': '10+ LPA',
};

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [departmentResponse, facultyResponse] = await Promise.all([
        api.get('/admin/department-stats'),
        api.get('/admin/faculty'),
      ]);
      setDepartments(departmentResponse.data || []);
      setFaculty(facultyResponse.data || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load department data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  usePolling(() => {
    loadData(false).catch(() => null);
  }, 15000, true);

  if (loading) {
    return <PageLoader label="Loading departments" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Departments</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Realtime department readiness overview</h1>
          <p className="mt-2 text-slate-600">
            Compare student volume, average progress, placement readiness, and faculty capacity across departments.
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

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {departments.map((department) => {
          const facultyCount = faculty.filter((member) => member.department === department.department).length;
          return (
            <div key={department.department} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{department.department}</p>
                      <p className="text-sm text-slate-500">{facultyCount} faculty mentors mapped here</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 text-right md:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Students</p>
                    <p className="text-xl font-semibold text-slate-900">{department.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Avg Progress</p>
                    <p className="text-xl font-semibold text-slate-900">{department.avgProgress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Placement Rate</p>
                    <p className="text-xl font-semibold text-slate-900">{department.placementRate}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    Eligible Students
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{department.eligibleStudents}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BarChart3 className="h-4 w-4" />
                    Category Distribution
                  </div>
                  <div className="mt-2 space-y-1 text-sm font-medium text-slate-900">
                    <p>{CATEGORY_LABELS['5lpa']}: {department.categoryDistribution?.['5lpa'] || 0}</p>
                    <p>{CATEGORY_LABELS['7lpa']}: {department.categoryDistribution?.['7lpa'] || 0}</p>
                    <p>{CATEGORY_LABELS['10lpa']}: {department.categoryDistribution?.['10lpa'] || 0}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Faculty Coverage</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{facultyCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDepartments;
