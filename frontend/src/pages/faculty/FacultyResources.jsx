import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ClipboardList, MessageCircle, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import usePolling from '../../hooks/usePolling';

const categoryLabels = {
  'mock-interview': 'Mock Interview',
  assessment: 'Assessment',
  exam: 'Examination',
  'company-visit': 'Company Visit',
  announcement: 'Announcement',
};

const FacultyResources = () => {
  const [forumPosts, setForumPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [doubtStats, setDoubtStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResources = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [forumResponse, studentsResponse, doubtsResponse] = await Promise.all([
        api.get('/forum'),
        api.get('/faculty/students-progress'),
        api.get('/faculty/doubts-stats'),
      ]);

      setForumPosts(forumResponse.data || []);
      setStudents(studentsResponse.data || []);
      setDoubtStats(doubtsResponse.data || null);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load faculty resources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources(true);
  }, [loadResources]);

  usePolling(() => {
    loadResources(false).catch(() => null);
  }, 15000, true);

  const summary = useMemo(() => {
    const reviewQueue = students.filter((entry) => (entry.progress?.progressPercentage || 0) < 75).length;
    const latestAnnouncements = forumPosts.filter((post) => post.creatorRole !== 'faculty').slice(0, 5);

    return {
      reviewQueue,
      latestAnnouncements,
    };
  }, [forumPosts, students]);

  if (loading) {
    return <PageLoader label="Loading resources" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Faculty Resource Center</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Realtime teaching and mentoring context</h1>
          <p className="mt-2 text-slate-600">
            Review active placement notices, student support queue, and mentor follow-up signals in one place.
          </p>
        </div>
        <button
          onClick={() => loadResources(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Placement Updates',
            value: forumPosts.length,
            detail: 'Forum notices available',
            icon: BookOpen,
          },
          {
            label: 'Pending Doubts',
            value: doubtStats?.pendingDoubts || 0,
            detail: 'Mentor replies required',
            icon: MessageCircle,
          },
          {
            label: 'Review Queue',
            value: summary.reviewQueue,
            detail: 'Students below 75%',
            icon: ClipboardList,
          },
          {
            label: 'Answered Doubts',
            value: doubtStats?.answeredDoubts || 0,
            detail: 'Support responses delivered',
            icon: CalendarDays,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{card.value}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Latest Official Updates</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Placement notices relevant to mentors</h2>
          <div className="mt-6 space-y-4">
            {summary.latestAnnouncements.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                No announcements have been posted yet.
              </div>
            )}
            {summary.latestAnnouncements.map((post) => (
              <div key={post._id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {categoryLabels[post.category] || 'Announcement'} | {post.company || 'General'}
                    </p>
                  </div>
                  {post.eventDate && (
                    <span className="text-sm text-slate-500">{new Date(post.eventDate).toLocaleString()}</span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{post.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mentor Watchlist</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Students needing quick help</h2>
          <div className="mt-6 space-y-4">
            {students
              .filter((entry) => (entry.progress?.progressPercentage || 0) < 75)
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
      </div>
    </div>
  );
};

export default FacultyResources;
