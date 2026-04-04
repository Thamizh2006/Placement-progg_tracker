import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  Code2,
  Headphones,
  Mic,
  MonitorUp,
  PhoneCall,
  ScreenShare,
  Users,
  Video,
} from 'lucide-react';
import MonacoCodeEditor from '../../components/MonacoCodeEditor';
import { useAuth } from '../../context/AuthContext';

const starterCode = `def max_subarray(nums):
    best = nums[0]
    current = nums[0]

    for value in nums[1:]:
        current = max(value, current + value)
        best = max(best, current)

    return best

print(max_subarray([2, -1, 3, -4, 5, 2]))`;

const sessionMetrics = [
  {
    label: 'Socket.io sync',
    value: '<120 ms',
    detail: 'Shared cursor and code updates during pair-programming.',
  },
  {
    label: 'Monaco editing',
    value: '2 roles',
    detail: 'Mentor and student editing together in one coding room.',
  },
  {
    label: 'Call formats',
    value: '1:1 + Group',
    detail: 'Consultation blocks for private and batch doubt resolution.',
  },
];

const liveCodingFeatures = [
  {
    icon: Code2,
    title: 'Mentor-student pair programming',
    detail: 'A shared editor room where both sides can explain, code, and iterate together in realtime.',
  },
  {
    icon: ScreenShare,
    title: 'Live doubt resolution with screen sharing',
    detail: 'Discuss blockers while walking through code, terminal output, and debugging steps on the same call.',
  },
  {
    icon: MonitorUp,
    title: 'Collaborative session controls',
    detail: 'Role-aware controls for read-only observation, active editing, and session handoff.',
  },
];

const consultationCards = [
  {
    icon: PhoneCall,
    title: '1:1 mentoring calls',
    detail: 'Quick intervention calls for resume reviews, coding blockers, and placement planning.',
    stack: 'Agora.io / Twilio',
  },
  {
    icon: Users,
    title: 'Group doubt clearing sessions',
    detail: 'Schedule cohort-level audio or video rooms for common interview topics and revision sprints.',
    stack: 'Multi-participant rooms',
  },
];

const timeline = [
  {
    time: '10:30 AM',
    title: 'Linked List Debug Room',
    audience: 'Student + Mentor',
    status: 'Live in 12 min',
  },
  {
    time: '2:00 PM',
    title: 'Mock Interview Debrief',
    audience: '1:1 Consultation',
    status: 'Booked',
  },
  {
    time: '6:30 PM',
    title: 'Group DSA Doubt Clearing',
    audience: '12 students',
    status: 'Seats available',
  },
];

const LiveSessionsPage = () => {
  const { role } = useAuth();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(starterCode);

  const isFaculty = role === 'faculty';

  const heroTitle = isFaculty
    ? 'Run live coding rooms and mentoring calls without leaving the portal.'
    : 'Jump into live coding rooms and mentoring calls with your faculty guide.';
  const heroDescription = isFaculty
    ? 'Use collaborative editing, code walkthroughs, and consultation queues to support students in realtime.'
    : 'Get pair-programming help, instant doubt resolution, and scheduled audio/video support in one place.';

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <Video className="h-4 w-4" />
              Live Coding + Consultations
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">{heroDescription}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white">
                Socket.io collaboration
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Monaco editor rooms
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                Agora.io / Twilio sessions
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {sessionMetrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Live Coding Session</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Collaborative editor preview</h2>
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This room preview uses the existing Monaco component so the shared editor experience is visible inside the product today.
          </p>
          <div className="mt-6">
            <MonacoCodeEditor value={code} language={language} onChange={setCode} height={360} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {liveCodingFeatures.map((feature) => (
              <div key={feature.title} className="rounded-3xl bg-slate-50 p-4">
                <feature.icon className="h-6 w-6 text-sky-700" />
                <p className="mt-4 font-semibold text-slate-900">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-sky-600" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Session Queue</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Today&apos;s lineup</h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {timeline.map((entry) => (
                <div key={entry.time + entry.title} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.time} • {entry.audience}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Headphones className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Consultation Modes</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Audio and video support</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {consultationCards.map((card) => (
                <div key={card.title} className="rounded-3xl bg-slate-50 p-5">
                  <card.icon className="h-6 w-6 text-emerald-700" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
                  <p className="mt-3 text-sm font-semibold text-emerald-700">{card.stack}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Mic,
            title: 'Instant audio fallback',
            detail: 'Switch to voice-only when bandwidth is low and keep the mentoring flow moving.',
          },
          {
            icon: Video,
            title: 'High-touch video consultations',
            detail: 'Use face-to-face mentoring blocks for interview prep, code reviews, and accountability check-ins.',
          },
          {
            icon: ScreenShare,
            title: 'Guided screen walkthroughs',
            detail: 'Share IDE, browser, or terminal context during difficult doubt-resolution moments.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <item.icon className="h-6 w-6 text-sky-700" />
            <h3 className="mt-5 text-xl font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Next Step</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isFaculty ? 'Open your mentoring workflow' : 'Return to your mentoring workspace'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isFaculty
                ? 'Follow up on doubts, student readiness, and live support sessions from the faculty workspace.'
                : 'Use your mentor page and doubt queue alongside these live session formats.'}
            </p>
          </div>
          <Link
            to={isFaculty ? '/faculty/doubts' : '/student/mentor'}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {isFaculty ? 'Open faculty workspace' : 'Open mentor page'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LiveSessionsPage;
