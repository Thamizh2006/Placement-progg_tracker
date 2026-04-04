import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AlertTriangle, Download, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import InsightFeed from '../../components/InsightFeed';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';
import {
  exportStaffPerformancePdf,
  exportStudentPerformancePdf,
} from '../../utils/pdfExport';

const emptyDashboard = {
  department: '',
  totalStudents: 0,
  facultyCount: 0,
  eligibleCount: 0,
  averageProgress: 0,
  categoryBreakdown: { '5lpa': 0, '7lpa': 0, '10lpa': 0 },
  totalDoubts: 0,
  pendingDoubts: 0,
};

const HodAnalytics = () => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    const [dashboardResponse, studentsResponse, facultyResponse] = await Promise.all([
      api.get('/hod/dashboard'),
      api.get('/hod/students'),
      api.get('/hod/faculty'),
    ]);

    setDashboard({ ...emptyDashboard, ...dashboardResponse.data });
    setStudents(studentsResponse.data || []);
    setFaculty(facultyResponse.data || []);
    setActivity(dashboardResponse.data.recentActivity || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadAnalytics();
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load department analytics.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  usePolling(() => {
    loadAnalytics().catch(() => null);
  }, 15000, true);

  const studentRows = useMemo(
    () =>
      students.map((entry) => ({
        email: entry.student.email,
        department: entry.student.department,
        category: entry.progress?.category || entry.student.selectedCategory || '-',
        progressPercentage: entry.progress?.progressPercentage || 0,
        eligible: entry.eligible,
        mentor: entry.student.assignedFaculty?.email || 'Unassigned',
        readinessScore: entry.readiness?.readinessScore || 0,
        atRiskReasons: entry.atRiskReasons || [],
      })),
    [students]
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

  const categoryChartData = useMemo(
    () => ({
      labels: ['5 LPA', '7 LPA', '10 LPA'],
      datasets: [
        {
          data: [
            dashboard.categoryBreakdown['5lpa'],
            dashboard.categoryBreakdown['7lpa'],
            dashboard.categoryBreakdown['10lpa'],
          ],
          backgroundColor: [chartPalette.emerald, chartPalette.cyan, chartPalette.lime],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    }),
    [dashboard.categoryBreakdown]
  );

  const studentChartData = useMemo(() => {
    const topStudents = [...studentRows]
      .sort((left, right) => right.progressPercentage - left.progressPercentage)
      .slice(0, 10);

    return {
      labels: topStudents.map((student) => student.email.split('@')[0]),
      datasets: [
        {
          label: 'Progress %',
          data: topStudents.map((student) => student.progressPercentage),
          backgroundColor: '#00ED64',
          borderRadius: 10,
        },
      ],
    };
  }, [studentRows]);

  const facultyChartData = useMemo(
    () => ({
      labels: staffRows.map((member) => member.email.split('@')[0]).slice(0, 8),
      datasets: [
        {
          label: 'Eligible Students %',
          data: staffRows.map((member) => member.readinessRate).slice(0, 8),
          backgroundColor: '#13AA52',
          borderRadius: 10,
        },
      ],
    }),
    [staffRows]
  );

  if (loading) {
    return <PageLoader label="Loading analytics" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              HOD Analytics
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Realtime visibility into every student and faculty signal in {dashboard.department}.
            </h1>
            <p className="mt-4 text-base text-slate-300">
              These charts refresh automatically and let you review performance, mentor impact, and
              readiness distribution before students reach the placement pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                exportStudentPerformancePdf({
                  rows: studentRows,
                  scopeLabel: `${dashboard.department} department`,
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
                  scopeLabel: `${dashboard.department} department`,
                })
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Download className="h-4 w-4" />
              Staff PDF
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Department Students', value: dashboard.totalStudents, detail: 'Live roster', icon: Users },
          { label: 'Faculty Mentors', value: dashboard.facultyCount, detail: 'Active department staff', icon: ShieldCheck },
          { label: 'Average Progress', value: `${dashboard.averageProgress}%`, detail: `${dashboard.eligibleCount} placement ready`, icon: TrendingUp },
          { label: 'At-Risk Students', value: dashboard.atRiskCount || 0, detail: `${dashboard.pendingDoubts} pending doubts in department`, icon: AlertTriangle },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{card.value}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-500">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Performance</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top progress snapshot</h2>
          <div className="mt-6 h-80">
            <Bar
              data={studentChartData}
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Category Mix</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Target salary distribution</h2>
          <div className="mt-6 h-80">
            <Doughnut
              data={categoryChartData}
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Performance</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mentor readiness score</h2>
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">High Priority Students</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Students below 75% readiness</h2>
          <div className="mt-6 space-y-3">
            {studentRows
              .filter((student) => !student.eligible || student.readinessScore < 55)
              .slice(0, 8)
              .map((student) => (
              <div key={student.email} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{student.email}</p>
                    <p className="text-sm text-slate-500">
                      {student.category} category | {student.mentor}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {(student.atRiskReasons || []).join(' | ') || 'Needs closer follow-up'}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    {student.readinessScore || student.progressPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InsightFeed
        title="Activity Feed"
        subtitle="Recent department actions"
        items={activity}
        emptyLabel="No recent department activity found."
        getPrimaryText={(item) => item.action}
        getSecondaryText={(item) => item.description}
        getMetaText={(item) => item.actorRole || 'system'}
        getPriority={() => 'low'}
      />
    </div>
  );
};

export default HodAnalytics;
