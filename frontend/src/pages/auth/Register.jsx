import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import PageTransition from '../../components/PageTransition';
import api from '../../utils/api';

const departments = [
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'ADS',
  'IT',
  'CYBER SECURITY',
  'CHEMICAL',
  'BIOTECHNOLOGY',
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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: 'CSE',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData((current) => ({ ...current, role }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
      });

      toast.success('Registration successful. Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const showDepartment = ['student', 'faculty', 'hod'].includes(formData.role);

  const roleCards = [
    { key: 'student', label: 'Student', icon: GraduationCap },
    { key: 'faculty', label: 'Faculty', icon: User },
    { key: 'hod', label: 'HOD', icon: Building },
    { key: 'superadmin', label: 'Superadmin', icon: Shield },
  ];

  return (
    <PageTransition>
      <AuthShell
        badge="Role Access Setup"
        title="Create account"
        description="Register a role-aware account with department mapping and controlled access."
        panelTitle="Register role-based access, including full superadmin control."
        panelDescription="The platform supports students, faculty, HOD, and superadmin flows in one connected workspace with department-aware dashboards, reports, and analytics."
        panelContent={
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-emerald-100">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold">Account setup guidance</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Use an official email address and create a strong password that matches your organization's access policy.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p>Students get progress, doubts, reports, assessments, and resume tools.</p>
              <p>Faculty and HOD get department-wide visibility and assignment workflows.</p>
              <p>Superadmin manages all users, departments, analytics, and settings.</p>
            </div>
          </div>
        }
      >
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {roleCards.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleChange(role.key)}
                  className={`interactive-card rounded-[1.25rem] border p-4 text-center text-sm font-medium ${
                    formData.role === role.key
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-lg shadow-emerald-100'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <role.icon className="h-5 w-5" />
                    <span className="capitalize">{role.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showDepartment && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input-field"
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-12"
                placeholder="Email"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Use a valid institutional or organization email address.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-12"
                placeholder="Password"
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field pl-12"
                placeholder="Confirm password"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Use at least 8 characters with a strong mix of letters and numbers.</p>
          </div>

          <button type="submit" disabled={loading} className="primary-button w-full">
            <span>{loading ? 'Creating account...' : 'Create account'}</span>
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-sky-700">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </PageTransition>
  );
};

export default Register;
