import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const HodAssignments = () => {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    facultyId: '',
  });

  const loadData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [studentsResponse, facultyResponse, assignmentsResponse] = await Promise.all([
        api.get('/hod/students'),
        api.get('/hod/faculty'),
        api.get('/hod/faculty-assignments'),
      ]);
      setStudents(studentsResponse.data);
      setFaculty(facultyResponse.data);
      setAssignments(assignmentsResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  usePolling(() => {
    loadData(false);
  }, 12000, true);

  const submitAssignment = async (event) => {
    event.preventDefault();
    setAssigning(true);
    try {
      await api.post('/hod/assign-mentor', form);
      toast.success('Mentor assigned successfully');
      setForm({ studentId: '', facultyId: '' });
      await loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign mentor');
    } finally {
      setAssigning(false);
    }
  };

  const unassignedStudents = students.filter((entry) => !entry.student.assignedFaculty);

  if (loading) {
    return <PageLoader label="Loading assignments" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Assignments</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Live mentor mapping</h1>
        </div>
        <button
          onClick={() => loadData(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <form onSubmit={submitAssignment} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Assign a student to faculty</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <select
            value={form.studentId}
            onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3"
            required
          >
            <option value="">Select unassigned student</option>
            {unassignedStudents.map((entry) => (
              <option key={entry.student._id} value={entry.student._id}>
                {entry.student.email}
              </option>
            ))}
          </select>
          <select
            value={form.facultyId}
            onChange={(event) => setForm((current) => ({ ...current, facultyId: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3"
            required
          >
            <option value="">Select faculty</option>
            {faculty.map((member) => (
              <option key={member._id} value={member._id}>
                {member.email}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={assigning}
          className="mt-4 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {assigning ? 'Assigning...' : 'Assign mentor'}
        </button>
      </form>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.faculty._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">{assignment.faculty.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {assignment.eligibleStudents} eligible of {assignment.totalStudents} assigned
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {assignment.students.map((student) => (
                <div key={student._id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{student.email}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {student.selectedCategory || 'No category'} • {student.progressPercentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HodAssignments;
