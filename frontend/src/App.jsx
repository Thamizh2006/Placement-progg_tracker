import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import PageLoader from './components/PageLoader';
import { useAuth } from './context/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProgress = lazy(() => import('./pages/StudentProgress'));
const StudentMentor = lazy(() => import('./pages/student/StudentMentor'));
const StudentDoubts = lazy(() => import('./pages/student/StudentDoubts'));
const StudentReports = lazy(() => import('./pages/student/StudentReports'));
const StudentAssessments = lazy(() => import('./pages/student/StudentAssessments'));
const StudentResumeBuilder = lazy(() => import('./pages/student/StudentResumeBuilder'));
const ForumPage = lazy(() => import('./pages/shared/ForumPage'));
const LiveSessionsPage = lazy(() => import('./pages/shared/LiveSessionsPage'));
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const FacultyStudents = lazy(() => import('./pages/faculty/FacultyStudents'));
const FacultyDoubts = lazy(() => import('./pages/faculty/FacultyDoubts'));
const FacultyResources = lazy(() => import('./pages/faculty/FacultyResources'));
const FacultyAssessments = lazy(() => import('./pages/faculty/FacultyAssessments'));
const HodDashboard = lazy(() => import('./pages/hod/HodDashboard'));
const HodFaculty = lazy(() => import('./pages/hod/HodFaculty'));
const HodStudents = lazy(() => import('./pages/hod/HodStudents'));
const HodAssignments = lazy(() => import('./pages/hod/HodAssignments'));
const HodAnalytics = lazy(() => import('./pages/hod/HodAnalytics'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminAssessments = lazy(() => import('./pages/admin/AdminAssessments'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminRoles = lazy(() => import('./pages/admin/AdminRoles'));

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <div>Protected Content</div>;
};

const RouteFallback = () => <PageLoader label="Loading page" />;

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="mentor" element={<StudentMentor />} />
            <Route path="doubts" element={<StudentDoubts />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="live-sessions" element={<LiveSessionsPage />} />
            <Route path="reports" element={<StudentReports />} />
            <Route path="assessments" element={<StudentAssessments />} />
            <Route path="resume" element={<StudentResumeBuilder />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="students" element={<FacultyStudents />} />
            <Route path="doubts" element={<FacultyDoubts />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="live-sessions" element={<LiveSessionsPage />} />
            <Route path="progress" element={<FacultyStudents />} />
            <Route path="resources" element={<FacultyResources />} />
            <Route path="assessments" element={<FacultyAssessments />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/hod/*"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<HodDashboard />} />
            <Route path="faculty" element={<HodFaculty />} />
            <Route path="students" element={<HodStudents />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="analytics" element={<HodAnalytics />} />
            <Route path="assignments" element={<HodAssignments />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['placement', 'superadmin']}>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route
              path="students"
              element={
                <div className="rounded-2xl bg-white p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                  <p className="mt-4 text-gray-600">Manage student accounts.</p>
                </div>
              }
            />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="assessments" element={<AdminAssessments />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/unauthorized"
            element={
              <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
                <div className="w-full max-w-md rounded-2xl bg-white p-12 text-center shadow-xl">
                  <h1 className="mb-4 text-3xl font-bold text-red-600">Unauthorized</h1>
                  <p className="mb-8 text-gray-600">You do not have access to this page.</p>
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="rounded-xl bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
