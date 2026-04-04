import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import PageLoader from '../../components/PageLoader';
import { baseChartOptions, chartPalette } from '../../lib/chartSetup';
import api from '../../utils/api';

const AdminAssessments = () => {
  const [assessmentData, setAssessmentData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assessmentsResponse, resumeResponse] = await Promise.all([
          api.get('/tests/analytics'),
          api.get('/resume/analytics'),
        ]);
        setAssessmentData(assessmentsResponse.data);
        setResumeData(resumeResponse.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summaryCards = [
    ['Total Tests', assessmentData?.summary?.totalTests || 0],
    ['Submissions', assessmentData?.summary?.totalSubmissions || 0],
    ['Avg Accuracy', `${assessmentData?.summary?.averageAccuracy || 0}%`],
    ['Pending Reviews', assessmentData?.summary?.pendingEvaluations || 0],
  ];

  const studentsChartData = useMemo(
    () => ({
      labels: (assessmentData?.topStudents || []).map((entry) => entry.student.split('@')[0]),
      datasets: [
        {
          label: 'Accuracy %',
          data: (assessmentData?.topStudents || []).map((entry) => entry.accuracy),
          backgroundColor: '#10B981',
          borderRadius: 10,
        },
      ],
    }),
    [assessmentData]
  );

  const roleChartData = useMemo(
    () => ({
      labels: Object.keys(resumeData?.summary?.roleTargets || {}),
      datasets: [
        {
          data: Object.values(resumeData?.summary?.roleTargets || {}),
          backgroundColor: [chartPalette.emerald, chartPalette.cyan, chartPalette.lime, chartPalette.amber],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }),
    [resumeData]
  );

  if (loading) {
    return <PageLoader label="Loading assessment analytics" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_25%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_45%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
          Assessment + Resume Analytics
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Monitor mock tests, coding profiles, and ATS readiness across the platform.
        </h1>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([label, value]) => (
          <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Top Assessment Performers</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Accuracy leaderboard</h2>
          <div className="mt-6 h-80">
            <Bar
              data={studentsChartData}
              options={{
                ...baseChartOptions,
                plugins: { ...baseChartOptions.plugins, legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume Targets</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role distribution</h2>
          <div className="mt-6 h-80">
            <Doughnut
              data={roleChartData}
              options={{ ...baseChartOptions, scales: undefined }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Coding Leaders</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Most consistent students</h2>
          <div className="mt-6 space-y-3">
            {(assessmentData?.codingLeaders || []).map((entry) => (
              <div key={entry.student} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.student}</p>
                    <p className="text-sm text-slate-500">{entry.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">{entry.readinessScore}%</p>
                    <p className="text-sm text-slate-500">Consistency {entry.consistencyScore}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Latest Faculty Reviews</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Evaluated post assessments</h2>
          <div className="mt-6 space-y-3">
            {(assessmentData?.recentEvaluations || []).map((entry) => (
              <div key={`${entry.student}-${entry.testTitle}-${entry.evaluatedAt}`} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.student}</p>
                    <p className="text-sm text-slate-500">{entry.department} | {entry.testTitle}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {entry.finalAccuracy}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Final score: {entry.finalScore}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume Targets</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role distribution and ATS health</h2>
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="h-80">
            <Doughnut
              data={roleChartData}
              options={{ ...baseChartOptions, scales: undefined }}
            />
          </div>
          <div className="space-y-3">
            {(resumeData?.topResumes || []).map((entry) => (
              <div key={entry.student} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.student}</p>
                    <p className="text-sm text-slate-500">
                      {entry.department} | {entry.targetRole} | {entry.template}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {entry.atsScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAssessments;
