import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookUser,
  Building2,
  FileSpreadsheet,
  Shield,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import usePolling from '../../hooks/usePolling';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';

const defaultOverview = {
  role: 'placement',
  access: {
    label: 'Placement Admin',
    permissions: [],
    manageableRoles: ['student', 'faculty', 'hod'],
  },
  summary: {
    totalStudents: 0,
    totalFaculty: 0,
    totalHods: 0,
    totalPlacementAdmins: 0,
    totalSuperadmins: 0,
    eligibleStudents: 0,
    averageProgress: 0,
    reportsGenerated: 0,
    pendingStudents: 0,
    pendingDoubts: 0,
  },
  quickActions: [],
  departments: [],
  faculty: [],
  recentDoubts: [],
  recentReports: [],
  recentActivity: [],
  assignmentPool: {
    students: [],
    faculty: [],
  },
};

const defaultDirectory = {
  counts: [],
  users: [],
};

const categoryOptions = ['5lpa', '7lpa', '10lpa'];
const departmentOptions = [
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'IT',
  'ADS',
  'CYBER SECURITY',
  'CHEMICAL',
  'BIOTECHNOLOGY',
];

const statusTone = {
  pending: 'bg-amber-100 text-amber-700',
  answered: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(defaultOverview);
  const [directory, setDirectory] = useState(defaultDirectory);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'student',
    department: 'CSE',
    selectedCategory: '5lpa',
  });
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    facultyId: '',
  });

  const manageableRoles = overview.access?.manageableRoles || [];
  const showDepartmentField = ['student', 'faculty', 'hod'].includes(createForm.role);
  const showCategoryField = createForm.role === 'student';

  const statCards = useMemo(
    () => [
      {
        label: 'Students',
        value: overview.summary.totalStudents,
        detail: `${overview.summary.eligibleStudents} eligible`,
        icon: Users,
        tone: 'from-emerald-500 to-green-600',
      },
      {
        label: 'Faculty',
        value: overview.summary.totalFaculty,
        detail: `${overview.summary.totalHods} HODs in system`,
        icon: BookUser,
        tone: 'from-cyan-500 to-blue-600',
      },
      {
        label: 'Average Progress',
        value: `${overview.summary.averageProgress}%`,
        detail: `${overview.summary.pendingStudents} still below threshold`,
        icon: BarChart3,
        tone: 'from-fuchsia-500 to-pink-600',
      },
      {
        label: 'Operational Queue',
        value: overview.summary.pendingDoubts,
        detail: `${overview.summary.reportsGenerated} reports generated`,
        icon: FileSpreadsheet,
        tone: 'from-amber-500 to-orange-600',
      },
    ],
    [overview.summary]
  );

  const departmentChartData = useMemo(
    () => ({
      labels: overview.departments.map((department) => department.department),
      datasets: [
        {
          label: 'Placement Rate %',
          data: overview.departments.map((department) => department.placementRate),
          backgroundColor: '#00ED64',
          borderRadius: 10,
        },
        {
          label: 'Average Progress %',
          data: overview.departments.map((department) => department.avgProgress),
          backgroundColor: '#38BDF8',
          borderRadius: 10,
        },
      ],
    }),
    [overview.departments]
  );

  const accessChartData = useMemo(
    () => ({
      labels: directory.counts.map((item) => item.role),
      datasets: [
        {
          data: directory.counts.map((item) => item.total),
          backgroundColor: [
            chartPalette.emerald,
            chartPalette.cyan,
            chartPalette.lime,
            chartPalette.amber,
            chartPalette.rose,
          ],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    }),
    [directory.counts]
  );

  const loadAdminData = async () => {
    const [overviewResponse, directoryResponse] = await Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/users'),
    ]);

    setOverview({ ...defaultOverview, ...overviewResponse.data });
    setDirectory({ ...defaultDirectory, ...directoryResponse.data });
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadAdminData();
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error.response?.data?.message || 'Unable to load admin data right now.',
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  usePolling(() => {
    loadAdminData().catch(() => null);
  }, 15000, true);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssignChange = (event) => {
    const { name, value } = event.target;
    setAssignForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreateUserLoading(true);
    setFeedback(null);

    try {
      const payload = {
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      };

      if (showDepartmentField) {
        payload.department = createForm.department;
      }

      if (showCategoryField) {
        payload.selectedCategory = createForm.selectedCategory;
      }

      const { data } = await api.post('/admin/users', payload);

      setFeedback({ type: 'success', message: data.message });
      setCreateForm({
        email: '',
        password: '',
        role: manageableRoles[0] || 'student',
        department: 'CSE',
        selectedCategory: '5lpa',
      });
      await loadAdminData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create user.',
      });
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleAssignStudent = async (event) => {
    event.preventDefault();
    setAssignLoading(true);
    setFeedback(null);

    try {
      const { data } = await api.post('/admin/assign-student', assignForm);
      setFeedback({ type: 'success', message: data.message });
      setAssignForm({ studentId: '', facultyId: '' });
      await loadAdminData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign student.',
      });
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] text-white shadow-2xl">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.95fr] lg:px-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                <Shield className="h-4 w-4" />
                {overview.access?.label || 'Admin'}
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200">
                Signed in as {user?.email || 'admin user'}
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                Realtime command center for roles, departments, reports, and placement readiness.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 lg:text-lg">
                This dashboard now refreshes automatically and gives placement teams and superadmin
                one live surface for operations, analytics, and user control.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {overview.access?.permissions?.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Access Scope</p>
              <div className="mt-5 h-64">
                <Doughnut
                  data={accessChartData}
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

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Live User Counts</p>
              <div className="mt-5 space-y-3">
                {directory.counts.map((item) => (
                  <div key={item.role} className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm capitalize text-slate-300">{item.role}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.total}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-[1.75rem] bg-gradient-to-br ${card.tone} p-6 text-white shadow-xl`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">{card.label}</p>
                <p className="mt-3 text-4xl font-semibold">{card.value}</p>
              </div>
              <card.icon className="h-11 w-11 text-white/85" />
            </div>
            <p className="mt-6 text-sm text-white/80">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Action Hub</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Role-aware shortcuts</h2>
            </div>
            <BadgeCheck className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {overview.quickActions.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <p className="text-lg font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Department Health</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Placement readiness by department</h2>
          <div className="mt-6 h-80">
            <Bar data={departmentChartData} options={baseChartOptions} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Departments</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Placement health by department</h2>
            </div>
            <Building2 className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="mt-6 space-y-4">
            {overview.departments.slice(0, 6).map((department) => (
              <div key={department.department} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{department.department}</p>
                    <p className="text-sm text-slate-500">
                      {department.eligibleStudents} of {department.totalStudents} students are eligible
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Avg Progress</p>
                    <p className="text-xl font-semibold text-slate-900">{department.avgProgress}%</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-lime-400"
                    style={{ width: `${department.placementRate}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>Placement rate</span>
                  <span>{department.placementRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Mentor capacity at a glance</h2>
          <div className="mt-6 space-y-4">
            {overview.faculty.map((faculty) => (
              <div
                key={faculty._id}
                className="flex items-center justify-between rounded-3xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{faculty.email}</p>
                  <p className="text-sm text-slate-500">{faculty.department || 'No department'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-900">
                    {faculty.assignedStudentsCount}
                  </p>
                  <p className="text-sm text-slate-500">assigned students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Recent Reports</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Latest generated outcomes</h2>
          <div className="mt-6 space-y-4">
            {overview.recentReports.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                No reports have been generated yet.
              </div>
            )}
            {overview.recentReports.map((report) => (
              <div key={report._id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {report.student?.email || 'Student unavailable'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {report.student?.department || 'Unknown department'} | {report.type}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      report.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {report.eligible ? 'Eligible' : 'Needs work'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{report.progressPercentage}% progress</span>
                  <span>{formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Recent Doubts</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Support queue visibility</h2>
          <div className="mt-6 space-y-4">
            {overview.recentDoubts.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                No doubts have been logged yet.
              </div>
            )}
            {overview.recentDoubts.map((doubt) => (
              <div key={doubt._id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{doubt.subject}</p>
                    <p className="text-sm text-slate-500">
                      {doubt.student?.email || 'Student unavailable'} | {doubt.student?.department || 'Unknown'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[doubt.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {doubt.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{doubt.faculty?.email || 'Unassigned faculty thread'}</span>
                  <span>{formatDistanceToNow(new Date(doubt.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Audit Trail</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent platform activity</h2>
        <div className="mt-6 space-y-4">
          {overview.recentActivity.length === 0 && (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
              No recent activity logged yet.
            </div>
          )}
          {overview.recentActivity.map((item) => (
            <div key={item._id} className="rounded-3xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.description}</p>
                  <p className="text-sm text-slate-500">
                    {item.actorEmail || 'System'} | {item.actorRole || 'service'}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleCreateUser}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">User Provisioning</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create a new account</h2>
            </div>
            <UserPlus className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={createForm.email}
                onChange={handleCreateChange}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="realtime.user@gmail.com"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Role
                <select
                  name="role"
                  value={createForm.role}
                  onChange={handleCreateChange}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {manageableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  name="password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  required
                  minLength={8}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Strong password"
                />
              </label>
            </div>

            {showDepartmentField && (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Department
                <select
                  name="department"
                  value={createForm.department}
                  onChange={handleCreateChange}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {showCategoryField && (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Student Category
                <select
                  name="selectedCategory"
                  value={createForm.selectedCategory}
                  onChange={handleCreateChange}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={createUserLoading}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createUserLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <form
          onSubmit={handleAssignStudent}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mentor Assignment</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Map students to faculty</h2>
            </div>
            <UserCog className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Unassigned Student
              <select
                name="studentId"
                value={assignForm.studentId}
                onChange={handleAssignChange}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select student</option>
                {overview.assignmentPool.students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.email} {student.department ? `(${student.department})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Faculty Mentor
              <select
                name="facultyId"
                value={assignForm.facultyId}
                onChange={handleAssignChange}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select faculty</option>
                {overview.assignmentPool.faculty.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.email} {faculty.department ? `(${faculty.department})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">System posture</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {overview.summary.pendingDoubts}
                </p>
                <p className="text-sm text-slate-600">pending doubts still need attention</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={assignLoading}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assignLoading ? 'Assigning mentor...' : 'Assign mentor'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminDashboard;
