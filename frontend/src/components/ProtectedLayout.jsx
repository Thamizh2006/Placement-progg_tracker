import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  BrainCircuit,
  BookOpen,
  Building2,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  MessageCircle,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import PageTransition from './PageTransition';

const ProtectedLayout = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleMenus = {
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
      { icon: BookOpen, label: 'Progress', path: '/student/progress' },
      { icon: Users, label: 'Mentor', path: '/student/mentor' },
      { icon: MessageCircle, label: 'Doubts', path: '/student/doubts' },
      { icon: Megaphone, label: 'Forum', path: '/student/forum' },
      { icon: FileText, label: 'Reports', path: '/student/reports' },
      { icon: BrainCircuit, label: 'Check Your Level', path: '/student/check-level' },
      { icon: Settings, label: 'Resume', path: '/student/resume' },
    ],
    faculty: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/faculty/dashboard' },
      { icon: Users, label: 'Students', path: '/faculty/students' },
      { icon: MessageCircle, label: 'Doubts', path: '/faculty/doubts' },
      { icon: Megaphone, label: 'Forum', path: '/faculty/forum' },
      { icon: BarChart3, label: 'Progress', path: '/faculty/progress' },
      { icon: BookOpen, label: 'Resources', path: '/faculty/resources' },
    ],
    hod: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/hod/dashboard' },
      { icon: Users, label: 'Faculty', path: '/hod/faculty' },
      { icon: BookOpen, label: 'Students', path: '/hod/students' },
      { icon: Megaphone, label: 'Forum', path: '/hod/forum' },
      { icon: BarChart3, label: 'Analytics', path: '/hod/analytics' },
      { icon: Settings, label: 'Assignments', path: '/hod/assignments' },
    ],
    placement: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Users, label: 'Students', path: '/admin/students' },
      { icon: Megaphone, label: 'Forum', path: '/admin/forum' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: FileText, label: 'Reports', path: '/admin/reports' },
      { icon: Building2, label: 'Departments', path: '/admin/departments' },
      { icon: BarChart3, label: 'Assessments', path: '/admin/assessments' },
    ],
    superadmin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Users, label: 'All Users', path: '/admin/users' },
      { icon: Building2, label: 'Departments', path: '/admin/departments' },
      { icon: Megaphone, label: 'Forum', path: '/admin/forum' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: FileText, label: 'Reports', path: '/admin/reports' },
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
      { icon: Shield, label: 'Roles', path: '/admin/roles' },
    ],
  };

  const menuItems = roleMenus[role] || [];
  const currentItem = menuItems.find((item) => location.pathname.startsWith(item.path));
  const showDepartmentBadge = role !== 'superadmin';

  const sidebarContent = (
    <>
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Placement Prep</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Portal Workspace</h1>
        <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-sm text-slate-300">{user?.email || 'Signed in user'}</p>
          <p className="mt-1 text-sm capitalize text-sky-200">{role}</p>
          <div className="mt-4 h-px bg-white/10" />
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">Current area</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {currentItem?.label || 'Workspace'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 transition duration-300 group-hover:scale-110" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition duration-300 hover:bg-rose-500/20"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.08),_transparent_24%)]">
      <div className="lg:hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Placement Prep</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{currentItem?.label || role}</p>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-[linear-gradient(180deg,_#08130F_0%,_#0D1F1B_45%,_#12332A_100%)] shadow-2xl">
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-white/10 p-3 text-white transition hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-y-auto bg-[linear-gradient(180deg,_#08130F_0%,_#0D1F1B_45%,_#12332A_100%)] lg:flex">
        {sidebarContent}
      </aside>

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="surface-card mb-6 hidden items-center justify-between gap-4 px-6 py-5 lg:flex">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace overview</p>
              <div className="mt-2 flex items-center gap-3">
                <Compass className="h-5 w-5 text-emerald-600" />
                <h2 className="text-2xl font-semibold text-slate-950">
                  {currentItem?.label || 'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="status-pill border border-sky-100 bg-sky-50 text-sky-700">
                {role}
              </span>
              {showDepartmentBadge ? (
                <span className="status-pill border border-emerald-100 bg-emerald-50 text-emerald-700">
                  {user?.department || 'All departments'}
                </span>
              ) : null}
            </div>
          </div>

          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
