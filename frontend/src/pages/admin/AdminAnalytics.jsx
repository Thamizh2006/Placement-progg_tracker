import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Download, Lock, Shield, Sparkles, Users } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';
import {
  exportStaffPerformancePdf,
  exportStudentPerformancePdf,
} from '../../utils/pdfExport';

const AdminAnalytics = () => {
  const { role } = useAuth();
  const isSuperadmin = role === 'superadmin';
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    const departmentRequest = isSuperadmin
      ? api.get('/report/analytics')
      : api.get('/admin/department-stats');

    const requests = [departmentRequest, api.get('/admin/faculty')];
    if (isSuperadmin) {
      requests.push(api.get('/admin/reports'));
    }

    const responses = await Promise.all(requests);

    setDepartments(responses[0].data || []);
    setFaculty(responses[1].data || []);
    setReports(isSuperadmin ? responses[2].data?.reports || [] : []);
  }, [isSuperadmin]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadAnalytics();
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadAnalytics]);

  usePolling(() => {
    loadAnalytics().catch(() => null);
  }, 15000, true);

  const studentRows = useMemo(
    () =>
      reports.map((report) => ({
        email: report.student.email,
        department: report.student.department,
        category: report.category,
        progressPercentage: report.progressPercentage,
        eligible: report.eligible,
        mentor: report.student.assignedFaculty?.email || 'Unassigned',
      })),
    [reports]
  );

  const staffRows = useMemo(
    () =>
      faculty.map((member) => {
        const readinessRate = member.assignedStudentsCount
          ? Math.round((member.eligibleStudentsCount / member.assignedStudentsCount) * 100)
          : 0;

        return {
          email: member.email,
          role: 'faculty',
          department: member.department,
          assignedStudentsCount: member.assignedStudentsCount || 0,
          eligibleStudentsCount: member.eligibleStudentsCount || 0,
          readinessRate,
        };
      }),
    [faculty]
  );

  const departmentChartData = useMemo(
    () => ({
      labels: departments.map((department) => department.department),
      datasets: [
        {
          label: 'Placement Rate %',
          data: departments.map((department) => department.placementRate),
          backgroundColor: '#00ED64',
          borderRadius: 10,
        },
        {
          label: 'Average Progress %',
          data: departments.map((department) => department.avgProgress),
          backgroundColor: '#38BDF8',
          borderRadius: 10,
        },
      ],
    }),
    [departments]
  );

  const facultyChartData = useMemo(
    () => ({
      labels: faculty.map((member) => member.email.split('@')[0]).slice(0, 10),
      datasets: [
        {
          label: 'Eligible Students %',
          data: staffRows.map((member) => member.readinessRate).slice(0, 10),
          backgroundColor: '#13AA52',
          borderRadius: 10,
        },
      ],
    }),
    [faculty, staffRows]
  );

  const categoryMixData = useMemo(() => {
    const distribution = departments.reduce(
      (accumulator, department) => {
        accumulator['5lpa'] += department.categoryDistribution?.['5lpa'] || 0;
        accumulator['7lpa'] += department.categoryDistribution?.['7lpa'] || 0;
        accumulator['10lpa'] += department.categoryDistribution?.['10lpa'] || 0;
        return accumulator;
      },
      { '5lpa': 0, '7lpa': 0, '10lpa': 0 }
    );

    return {
      labels: ['5 LPA', '7 LPA', '10 LPA'],
      datasets: [
        {
          data: [distribution['5lpa'], distribution['7lpa'], distribution['10lpa']],
          backgroundColor: [chartPalette.emerald, chartPalette.cyan, chartPalette.lime],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    };
  }, [departments]);

  if (loading) {
    return <PageLoader label="Loading analytics" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_32%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <Shield className="h-4 w-4" />
              {isSuperadmin ? 'Superadmin Analytics' : 'Placement Analytics'}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Realtime analytics across departments, mentors, and readiness signals.
            </h1>
            <p className="mt-4 text-base text-slate-300">
              HODs and superadmin roles now have analytics visibility, while the superadmin account
              can also export student and staff performance as PDFs for review and compliance.
            </p>
          </div>

          {isSuperadmin && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  exportStudentPerformancePdf({
                    rows: studentRows,
                    scopeLabel: 'all departments',
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50"
              >
                <Download className="h-4 w-4" />
                Student PDF
              </button>
              <button
                type="button"
                onClick={() =>
                  exportStaffPerformancePdf({
                    rows: staffRows,
                    scopeLabel: 'all departments',
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Download className="h-4 w-4" />
                Staff PDF
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Department Comparison</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Placement rate and progress</h2>
          <div className="mt-6 h-96">
            <Bar data={departmentChartData} options={baseChartOptions} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Category Mix</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Current student targeting</h2>
          <div className="mt-6 h-96">
            <Doughnut
              data={categoryMixData}
              options={{
                ...baseChartOptions,
                scales: undefined,
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Staff Performance</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Faculty readiness comparison</h2>
          <div className="mt-6 h-80">
            <Bar
              data={facultyChartData}
              options={{
                ...baseChartOptions,
                plugins: {
                  ...baseChartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role Access</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Protected analytics scope</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-900">HOD visibility</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                HODs can inspect student and mentor performance for their own department only.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">Superadmin visibility</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Superadmin can compare every department, export PDFs, and manage all roles from one
                control plane.
              </p>
            </div>
            {!isSuperadmin && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <p className="font-semibold text-amber-900">Detailed staff and student tables are restricted</p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Only superadmin and HOD roles can view person-level performance analysis.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isSuperadmin && (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Every tracked student</h2>
              </div>
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="mt-6 space-y-3">
              {studentRows.slice(0, 12).map((student) => (
                <div key={`${student.email}-${student.category}`} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{student.email}</p>
                      <p className="text-sm text-slate-500">
                        {student.department} | {student.category} | {student.mentor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">{student.progressPercentage}%</p>
                      <p className={`text-sm font-medium ${student.eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {student.eligible ? 'Eligible' : 'Needs attention'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Staff Detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Faculty performance board</h2>
              </div>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="mt-6 space-y-3">
              {staffRows.slice(0, 12).map((member) => (
                <div key={member.email} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{member.email}</p>
                      <p className="text-sm text-slate-500">
                        {member.department} | {member.assignedStudentsCount} assigned students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">{member.readinessRate}%</p>
                      <p className="text-sm font-medium text-emerald-700">
                        {member.eligibleStudentsCount} placement ready
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminAnalytics;
