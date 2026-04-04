import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Megaphone, RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const categoryLabels = {
  'mock-interview': 'Mock Interview',
  assessment: 'Assessment',
  exam: 'Examination',
  'company-visit': 'Company Visit',
  announcement: 'Announcement',
};

const canPostRoles = ['faculty', 'hod', 'placement', 'superadmin'];

const ForumPage = () => {
  const { role } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'announcement',
    company: '',
    eventDate: '',
    venue: '',
  });

  const canPost = canPostRoles.includes(role);

  const loadPosts = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/forum');
      setPosts(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  usePolling(() => {
    loadPosts(false);
  }, 12000, true);

  const submitPost = async (event) => {
    event.preventDefault();
    setPosting(true);

    try {
      await api.post('/forum', {
        ...form,
        company: form.company || null,
        venue: form.venue || null,
        eventDate: form.eventDate || null,
      });
      toast.success('Forum update posted successfully');
      setForm({
        title: '',
        message: '',
        category: 'announcement',
        company: '',
        eventDate: '',
        venue: '',
      });
      await loadPosts(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post forum update');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading forum" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Placement Forum</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Company visits, mock interviews, assessments, and exam updates
          </h1>
          <p className="mt-2 text-slate-600">
            Visible to all students and faculty. Students can read only. Faculty, HOD, placement
            admins, and superadmins can post updates.
          </p>
        </div>
        <button
          onClick={() => loadPosts(true)}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {canPost && (
        <form onSubmit={submitPost} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-sky-600" />
            <h2 className="text-2xl font-semibold text-slate-900">Post a placement update</h2>
          </div>

          <div className="mt-6 grid gap-4">
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Title"
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Company name"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(event) => setForm((current) => ({ ...current, eventDate: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              />
              <input
                type="text"
                value={form.venue}
                onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Venue"
              />
            </div>

            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Share the upcoming placement information"
              required
            />
          </div>

          <button
            type="submit"
            disabled={posting}
            className="mt-5 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post update'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
            No forum announcements yet.
          </div>
        )}

        {posts.map((post) => (
          <div key={post._id} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">{post.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                    {categoryLabels[post.category] || 'Announcement'}
                  </span>
                  {post.company && <span>{post.company}</span>}
                  <span>by {post.createdBy?.email || post.creatorRole}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {post.message}
            </p>

            {(post.eventDate || post.venue) && (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {post.eventDate && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(post.eventDate).toLocaleString()}
                  </span>
                )}
                {post.venue && <span>Venue: {post.venue}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumPage;
