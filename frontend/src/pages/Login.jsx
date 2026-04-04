import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const quickAccounts = [
  {
    label: 'Student',
    email: 'realtime.student@gmail.com',
    password: 'Test@123',
  },
  {
    label: 'Faculty',
    email: 'realtime.faculty@gmail.com',
    password: 'Faculty@123',
  },
  {
    label: 'HOD',
    email: 'realtime.hod@gmail.com',
    password: 'Hod@123',
  },
  {
    label: 'Superadmin',
    email: 'realtime.superadmin@gmail.com',
    password: 'SuperAdmin@123',
  },
];

const getAuthErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Backend server is not reachable. Start the backend and MongoDB, then try again.';
  }

  return fallback;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const userData = data.user || { role: data.role };
      const role = userData.role;

      login(data.token, userData);
      toast.success('Login successful');

      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else if (role === 'hod') navigate('/hod/dashboard');
      else if (['placement', 'superadmin'].includes(role)) navigate('/admin/dashboard');
      else navigate('/');
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        badge="Placement Prep"
        title="Welcome back"
        description="Sign in with your registered account to continue into the role-based workspace."
        panelTitle="One polished workspace for students, faculty, HOD, placement teams, and superadmin."
        panelDescription="Use quick credentials to jump into any role, validate workflows, and navigate the complete system with smoother motion and cleaner UI."
        panelContent={
          <div className="space-y-4">
            {quickAccounts.map((account, index) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="interactive-card flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div>
                  <p className="font-semibold text-white">{account.label}</p>
                  <p className="mt-1 text-sm text-slate-300">{account.email}</p>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Autofill
                </span>
              </button>
            ))}
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Faster demo access
            </div>
            <p className="mt-2 leading-6">Pick any quick account from the left panel to auto-fill valid credentials.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field pl-12"
                placeholder="realtime.student@gmail.com"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Example: `realtime.student@gmail.com`</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field pl-12"
                placeholder="Test@123"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Example format: `Test@123`</p>
          </div>

          <button type="submit" disabled={loading} className="primary-button w-full">
            <span>{loading ? 'Signing in...' : 'Sign in to workspace'}</span>
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 text-sm lg:hidden">
          <p className="font-semibold text-slate-900">Quick superadmin login</p>
          <p className="mt-2 text-slate-600">Email: realtime.superadmin@gmail.com</p>
          <p className="mt-1 text-slate-600">Password: SuperAdmin@123</p>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Need a new account?{' '}
          <a href="/register" className="font-semibold text-emerald-700 transition hover:text-sky-700">
            Create one
          </a>
        </div>
      </AuthShell>
    </PageTransition>
  );
};

export default Login;
