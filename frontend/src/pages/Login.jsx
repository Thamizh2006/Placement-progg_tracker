import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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
        panelDescription="Access dashboards, reports, assessments, and collaboration tools through a secure role-based experience."
        panelContent={
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold">Secure sign-in</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Use your authorized institutional email and password to enter the platform.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p>Students can track progress, reports, assessments, and resume readiness.</p>
              <p>Faculty and HOD accounts include mentoring, review, and departmental oversight tools.</p>
              <p>Administrative access unlocks user provisioning, analytics, and operating controls.</p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Account access
            </div>
            <p className="mt-2 leading-6">
              Enter the email address and password assigned to your account to continue.
            </p>
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
                placeholder="Email"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Use the email address registered for your account.</p>
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
                placeholder="Password"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Passwords are case-sensitive.</p>
          </div>

          <button type="submit" disabled={loading} className="primary-button w-full">
            <span>{loading ? 'Signing in...' : 'Sign in to workspace'}</span>
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Need a new account?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 transition hover:text-sky-700">
            Create one
          </Link>
        </div>
      </AuthShell>
    </PageTransition>
  );
};

export default Login;
