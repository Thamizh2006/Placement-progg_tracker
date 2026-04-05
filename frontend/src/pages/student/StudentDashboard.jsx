import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import {
  BellRing,
  ArrowRight,
  FileText,
  Lightbulb,
  MessageCircle,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import InsightFeed from '../../components/InsightFeed';
import { useAuth } from '../../context/AuthContext';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';

const emptyStats = {
  progress: 0,
  mentor: null,
  pendingDoubts: 0,
  reportsReady: 0,
};

const getCategoryLabel = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value.name) {
    return value.name;
  }

  return '';
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [progressData, setProgressData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    const [
      dashboardResponse,
      progressResponse,
      eligibilityResponse,
      readinessResponse,
      notificationsResponse,
      activityResponse,
    ] = await Promise.allSettled([
      api.get('/student/dashboard'),
      api.get('/student/my-progress'),
      api.get('/student/check-eligibility'),
      api.get('/student/readiness-insights'),
      api.get('/activity/notifications'),
      api.get('/activity/feed'),
    ]);

    if (dashboardResponse.status === 'fulfilled') {
      setStats({ ...emptyStats, ...dashboardResponse.value.data });
      setLeaderboard(dashboardResponse.value.data.leaderboard || []);
    }

    if (progressResponse.status === 'fulfilled') {
      setProgressData(progressResponse.value.data);
    } else {
      setProgressData(null);
    }

    if (eligibilityResponse.status === 'fulfilled') {
      setEligibility(eligibilityResponse.value.data);
    } else {
      setEligibility(null);
    }

    if (readinessResponse.status === 'fulfilled') {
      setReadiness(readinessResponse.value.data);
    } else {
      setReadiness(null);
    }

    if (notificationsResponse.status === 'fulfilled') {
      setNotifications(notificationsResponse.value.data.notifications || []);
    } else {
      setNotifications([]);
    }

    if (activityResponse.status === 'fulfilled') {
      setActivityFeed(activityResponse.value.data || []);
    } else {
      setActivityFeed([]);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchStudentData();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  usePolling(() => {
    fetchStudentData().catch(() => null);
  }, 12000, true);

  const chartData = useMemo(
    () => ({
      labels: ['Completed', 'Remaining'],
      datasets: [
        {
          data: [stats.progress, Math.max(100 - stats.progress, 0)],
          backgroundColor: [chartPalette.emerald, '#E2E8F0'],
          borderWidth: 0,
        },
      ],
    }),
    [stats.progress]
  );

  const quickLinks = [
    {
      icon: TrendingUp,
      label: 'Update Progress',
      path: '/student/progress',
      detail: 'Complete tasks and sync your latest work.',
    },
    {
      icon: User,
      label: 'Mentor',
      path: '/student/mentor',
      detail: 'Choose or change your assigned faculty mentor.',
    },
    {
      icon: MessageCircle,
      label: 'Doubts',
      path: '/student/doubts',
      detail: 'Ask your mentor for help on blockers.',
    },
    {
      icon: FileText,
      label: 'Reports',
      path: '/student/reports',
      detail: 'Generate and download your readiness reports.',
    },
  ];

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Realtime Student Workspace
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Stay focused on placement readiness with live progress, mentor visibility, and report access.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Your dashboard refreshes automatically, so your current progress, doubts, and report
              status stay visible without manual reloads.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white">
                {user?.email}
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                {user?.department || 'Department not set'}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                {getCategoryLabel(progressData?.category) ||
                  getCategoryLabel(progressData?.progress?.category) ||
                  getCategoryLabel(user?.selectedCategory) ||
                  'Category not selected'}
              </span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current Readiness</p>
            <div className="mt-4 h-64">
              <Doughnut
                data={chartData}
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
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Overall Progress', value: `${stats.progress}%`, detail: `${progressData?.completedTasks?.length || 0} tasks completed`, tone: 'from-emerald-500 to-green-600' },
          { label: 'Assigned Mentor', value: stats.mentor?.name || 'Pending', detail: stats.mentor?.email || 'Choose a mentor to unlock faster support', tone: 'from-cyan-500 to-blue-600' },
          { label: 'Pending Doubts', value: stats.pendingDoubts, detail: stats.pendingDoubts ? 'Waiting for mentor response' : 'No open doubt threads', tone: 'from-amber-500 to-orange-600' },
          { label: 'AI Readiness', value: `${readiness?.readinessScore || 0}%`, detail: readiness?.readinessLevel || 'Readiness score updates automatically', tone: 'from-fuchsia-500 to-pink-600' },
        ].map((card) => (
          <div key={card.label} className={`rounded-[1.75rem] bg-gradient-to-br ${card.tone} p-6 text-white shadow-xl`}>
            <p className="text-sm uppercase tracking-[0.2em] text-white/75">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold">{card.value}</p>
            <p className="mt-4 text-sm text-white/85">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Quick Actions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Keep your workflow moving</h2>
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Eligibility Status</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Placement readiness</h2>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                eligibility?.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {eligibility?.eligible ? 'Eligible' : 'In Progress'}
            </span>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {eligibility?.message || 'Select a category and start completing tasks to unlock eligibility insights.'}
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{stats.progress}% complete</p>
            {readiness?.improvementSuggestions?.length ? (
              <div className="mt-5 rounded-2xl border border-sky-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sky-700">
                  <Lightbulb className="h-4 w-4" />
                  <p className="text-sm font-semibold">AI improvement plan</p>
                </div>
                <div className="mt-3 space-y-2">
                  {readiness.improvementSuggestions.slice(0, 3).map((tip) => (
                    <p key={tip} className="text-sm text-slate-600">
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Weak Areas</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Smart mentor signals</h2>
          <div className="mt-6 space-y-3">
            {(readiness?.weakAreas || []).length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                Your roadmap looks balanced right now. Keep logging task updates to maintain momentum.
              </div>
            )}
            {(readiness?.weakAreas || []).map((area) => (
              <div key={area.label} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{area.label}</p>
                    <p className="text-sm text-slate-500">{area.summary}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    {area.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leaderboard</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top students in {user?.department}</h2>
          <div className="mt-6 space-y-3">
            {leaderboard.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                No department leaderboard data yet.
              </div>
            )}
            {leaderboard.map((entry, index) => (
              <div key={`${entry.email}-${index}`} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      #{index + 1} {entry.email}
                    </p>
                    <p className="text-sm text-slate-500">
                      {String(entry.studentId) === String(user?._id)
                        ? 'You are on the board'
                        : 'Department performance snapshot'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {entry.progressPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <InsightFeed
          title="Notifications"
          subtitle="Live updates"
          items={notifications.slice(0, 6)}
          emptyLabel="You are all caught up."
          getPrimaryText={(item) => item.title}
          getSecondaryText={(item) => item.message}
          getMetaText={(item) => item.priority || 'live'}
          getPriority={(item) => item.priority}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <InsightFeed
          title="Activity Feed"
          subtitle="What changed around you"
          items={activityFeed}
          emptyLabel="No recent activity yet."
          getPrimaryText={(item) => item.action}
          getSecondaryText={(item) => item.description}
          getMetaText={(item) => item.actorRole || 'system'}
          getPriority={() => 'low'}
        />

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-950">
            <BellRing className="h-5 w-5 text-sky-600" />
            <h2 className="text-2xl font-semibold">Smart next steps</h2>
          </div>
          <div className="mt-6 space-y-4">
            {(readiness?.improvementSuggestions || [
              'Select a category and start completing tasks to activate AI guidance.',
            ]).map((suggestion) => (
              <div key={suggestion} className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {suggestion}
              </div>
            ))}
            <Link
              to="/student/mentor"
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Review mentor suggestions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
