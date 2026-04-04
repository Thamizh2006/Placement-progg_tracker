import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';

const emptyStats = {
  facultyCount: 0,
  totalStudents: 0,
  averageProgress: 0,
  eligibleCount: 0,
  categoryBreakdown: { '5lpa': 0, '7lpa': 0, '10lpa': 0 },
};

const HodDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHodData = async () => {
    const [dashboardResponse, facultyResponse, studentsResponse] = await Promise.all([
      api.get('/hod/dashboard'),
      api.get('/hod/faculty'),
      api.get('/hod/students'),
    ]);

    setStats({ ...emptyStats, ...dashboardResponse.data });
    setFaculty(facultyResponse.data || []);
    setStudents(studentsResponse.data || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchHodData();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  usePolling(() => {
    fetchHodData().catch(() => null);
  }, 12000, true);

  const placementRate = stats.totalStudents
    ? Math.round((stats.eligibleCount / stats.totalStudents) * 100)
    : 0;

  const categoryChartData = useMemo(
    () => ({
      labels: ['5 LPA', '7 LPA', '10 LPA'],
      datasets: [
        {
          data: [
            stats.categoryBreakdown['5lpa'],
            stats.categoryBreakdown['7lpa'],
            stats.categoryBreakdown['10lpa'],
          ],
          backgroundColor: [chartPalette.emerald, chartPalette.cyan, chartPalette.lime],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    }),
    [stats.categoryBreakdown]
  );

  const facultyChartData = useMemo(
    () => ({
      labels: faculty.map((member) => member.email.split('@')[0]).slice(0, 8),
      datasets: [
        {
          label: 'Eligible Students %',
          data: faculty
            .map((member) =>
              member.assignedStudentsCount
                ? Math.round((member.eligibleStudentsCount / member.assignedStudentsCount) * 100)
                : 0
            )
            .slice(0, 8),
          backgroundColor: '#13AA52',
          borderRadius: 10,
        },
      ],
    }),
    [faculty]
  );

  const menuItems = [
    { icon: Users, label: 'Faculty', path: '/hod/faculty', detail: 'Mentor roster and impact' },
    { icon: Building2, label: 'Students', path: '/hod/students', detail: 'Department readiness board' },
    { icon: TrendingUp, label: 'Analytics', path: '/hod/analytics', detail: 'Charts and exports' },
    { icon: Settings, label: 'Assignments', path: '/hod/assignments', detail: 'Map students to mentors' },
  ];

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              Realtime HOD Command Center
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Manage faculty performance and student readiness for {user?.department}.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              This view combines department metrics, mentor performance, and category distribution
              so you can act early on progress gaps.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Category Mix</p>
              <div className="mt-4 h-56">
                <Doughnut
                  data={categoryChartData}
                  options={{
                    ...baseChartOptions,
                    scales: undefined,
                    plugins: {
                      ...baseChartOptions.plugins,
                      legend: {
                        position: 'bottom',
                        labels: {
                          ...baseChartOptions.plugins.legend.labels,
                          color: '#CBD5E1',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Placement Rate</p>
              <p className="mt-6 text-5xl font-semibold text-white">{placementRate}%</p>
              <p className="mt-3 text-sm text-slate-300">
                {stats.eligibleCount} of {stats.totalStudents} students are placement ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Faculty Members', value: stats.facultyCount, detail: 'Active mentors', tone: 'from-emerald-500 to-green-600' },
          { label: 'Students', value: stats.totalStudents, detail: 'Department roster', tone: 'from-cyan-500 to-blue-600' },
          { label: 'Average Progress', value: `${stats.averageProgress}%`, detail: 'Current department average', tone: 'from-fuchsia-500 to-pink-600' },
          { label: 'Placement Ready', value: stats.eligibleCount, detail: 'Students above 75%', tone: 'from-amber-500 to-orange-600' },
        ].map((card) => (
          <div key={card.label} className={`rounded-[1.75rem] bg-gradient-to-br ${card.tone} p-6 text-white shadow-xl`}>
            <p className="text-sm uppercase tracking-[0.2em] text-white/75">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold">{card.value}</p>
            <p className="mt-4 text-sm text-white/85">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Department Actions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Operate your department clearly</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <item.icon className="h-8 w-8 text-emerald-700" />
                <p className="mt-4 text-lg font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Impact</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mentor performance snapshot</h2>
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
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Students Needing Intervention</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Priority follow-up list</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students
            .filter((entry) => !entry.eligible)
            .slice(0, 6)
            .map((entry) => (
              <div key={entry.student._id} className="rounded-3xl border border-slate-100 p-5">
                <p className="font-semibold text-slate-900">{entry.student.email}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {entry.student.assignedFaculty?.email || 'No mentor assigned'}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${entry.progress?.progressPercentage || 0}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {entry.progress?.progressPercentage || 0}% progress
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default HodDashboard;
