import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  ArrowRight,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions } from '../../lib/chartSetup';
import api from '../../utils/api';

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    assignedStudentsCount: 0,
    pendingDoubts: 0,
    averageProgress: 0,
    eligibleCount: 0,
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacultyData = async () => {
    const [dashboardResponse, studentsResponse] = await Promise.all([
      api.get('/faculty/dashboard'),
      api.get('/faculty/students-progress'),
    ]);

    setStats(dashboardResponse.data || {});
    setStudents(studentsResponse.data || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchFacultyData();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  usePolling(() => {
    fetchFacultyData().catch(() => null);
  }, 12000, true);

  const chartData = useMemo(() => {
    const topStudents = [...students]
      .sort(
        (left, right) =>
          (right.progress?.progressPercentage || 0) - (left.progress?.progressPercentage || 0)
      )
      .slice(0, 8);

    return {
      labels: topStudents.map((entry) => entry.student.email.split('@')[0]),
      datasets: [
        {
          label: 'Progress %',
          data: topStudents.map((entry) => entry.progress?.progressPercentage || 0),
          backgroundColor: '#00ED64',
          borderRadius: 10,
        },
      ],
    };
  }, [students]);

  const quickLinks = [
    {
      icon: Users,
      label: 'Students',
      path: '/faculty/students',
      detail: 'Review every assigned mentee and their live status.',
    },
    {
      icon: MessageCircle,
      label: 'Doubts',
      path: '/faculty/doubts',
      detail: 'Answer active doubt threads from your students.',
    },
    {
      icon: Video,
      label: 'Live Sessions',
      path: '/faculty/live-sessions',
      detail: 'Host pair-programming rooms and video consultations.',
    },
    {
      icon: TrendingUp,
      label: 'Progress',
      path: '/faculty/progress',
      detail: 'Track readiness progress across your mentees.',
    },
    {
      icon: BookOpen,
      label: 'Forum',
      path: '/faculty/forum',
      detail: 'Share placement updates and official notices.',
    },
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
              Realtime Faculty Dashboard
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Mentor students with live progress signals, pending doubt alerts, and readiness snapshots.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Your dashboard updates automatically so you can see who needs intervention without
              refreshing or jumping across multiple screens.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Progress View</p>
            <div className="mt-5 h-72">
              <Bar
                data={chartData}
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
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Assigned Students', value: stats.assignedStudentsCount || 0, detail: 'Active mentoring load', tone: 'from-emerald-500 to-green-600' },
          { label: 'Pending Doubts', value: stats.pendingDoubts || 0, detail: 'Awaiting response', tone: 'from-cyan-500 to-blue-600' },
          { label: 'Average Progress', value: `${stats.averageProgress || 0}%`, detail: 'Across assigned students', tone: 'from-fuchsia-500 to-pink-600' },
          { label: 'Placement Ready', value: stats.eligibleCount || 0, detail: 'Students above 75%', tone: 'from-amber-500 to-orange-600' },
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Actions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Daily mentoring workflow</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((item) => (
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Students Needing Attention</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Below 75% readiness</h2>
          <div className="mt-6 space-y-3">
            {students
              .filter((entry) => !entry.eligible)
              .slice(0, 8)
              .map((entry) => (
                <div key={entry.student._id} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.student.email}</p>
                      <p className="text-sm text-slate-500">
                        {entry.student.department} | {entry.student.selectedCategory || 'No category'}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                      {entry.progress?.progressPercentage || 0}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyDashboard;
