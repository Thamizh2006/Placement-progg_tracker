import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, RefreshCw, UserRoundSearch } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const StudentMentor = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [mentor, setMentor] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const loadMentorData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [facultyResponse, mentorResponse, recommendationsResponse] = await Promise.all([
        api.get('/student/faculty', { params: { department: user?.department } }),
        api.get('/student/mentor').catch(() => ({ data: { mentor: null } })),
        api.get('/student/mentor-recommendations').catch(() => ({
          data: { recommendations: [], weakAreas: [], summary: '' },
        })),
      ]);
      setFaculty(facultyResponse.data);
      setMentor(mentorResponse.data.mentor);
      setRecommendations(recommendationsResponse.data.recommendations || []);
      setWeakAreas(recommendationsResponse.data.weakAreas || []);
      setSummary(recommendationsResponse.data.summary || '');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load mentor data');
    } finally {
      setLoading(false);
    }
  }, [user?.department]);

  useEffect(() => {
    loadMentorData(true);
  }, [loadMentorData]);

  usePolling(() => {
    loadMentorData(false);
  }, 15000, true);

  const assignMentor = async (facultyId) => {
    setUpdatingId(facultyId);
    try {
      if (mentor?._id) {
        await api.put('/student/change-mentor', { facultyId });
      } else {
        await api.post('/student/choose-mentor', { facultyId });
      }
      toast.success('Mentor updated successfully');
      await loadMentorData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update mentor');
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) {
    return <PageLoader label="Loading mentor" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mentor Selection</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Choose your faculty mentor</h1>
          <p className="mt-2 text-slate-600">
            Your assigned mentor updates live and is used for doubt routing and guidance.
          </p>
        </div>
        <button
          onClick={() => loadMentorData(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-6 w-6 text-sky-600" />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Smart Mentor Assistant</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">AI mentor recommendations</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {summary || 'Mentor suggestions will appear once your category and progress data are available.'}
        </p>
        {!!weakAreas.length && (
          <div className="mt-4 flex flex-wrap gap-3">
            {weakAreas.map((area) => (
              <span
                key={area.label}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
              >
                {area.label} {area.completionRate}%
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current Mentor</p>
        <div className="mt-4 rounded-3xl bg-slate-50 p-5">
          {mentor ? (
            <>
              <p className="text-xl font-semibold text-slate-900">{mentor.email}</p>
              <p className="mt-1 text-slate-600">{mentor.department}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-900">No mentor assigned</p>
              <p className="mt-1 text-slate-600">Select one from the department list below.</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <UserRoundSearch className="h-6 w-6 text-sky-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Available faculty</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faculty.map((member) => {
            const recommendation = recommendations.find(
              (entry) => String(entry._id) === String(member._id)
            );

            return (
            <div key={member._id} className="rounded-3xl border border-slate-100 p-5">
              <p className="text-lg font-semibold text-slate-900">{member.email}</p>
              <p className="mt-1 text-slate-500">{member.department}</p>
              <p className="mt-3 text-sm text-slate-600">
                Assigned students: {member.assignedStudentsCount || 0}
              </p>
              {recommendation && (
                <div className="mt-4 rounded-2xl bg-sky-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-sky-800">AI fit score</p>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-sky-700">
                      {recommendation.recommendationScore}%
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recommendation.reasons.slice(0, 2).map((reason) => (
                      <p key={reason} className="text-sm leading-6 text-slate-600">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => assignMentor(member._id)}
                disabled={updatingId === member._id || mentor?._id === member._id}
                className="mt-4 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {mentor?._id === member._id
                  ? 'Current mentor'
                  : updatingId === member._id
                    ? 'Updating...'
                    : mentor
                      ? 'Change mentor'
                      : 'Choose mentor'}
              </button>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default StudentMentor;
