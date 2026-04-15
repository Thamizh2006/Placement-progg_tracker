import { useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import { predictStudentLevel } from '../../utils/levelPredictor';

const domainOptions = [
  'Full Stack Development',
  'Data Science',
  'Java Backend',
  'Python Development',
  'Core CS / General',
];

const examples = {
  dsa: 'arrays, strings, linked list, stack, queue, sorting',
  domain: 'html, css, javascript, react, node, express, mongodb',
};

const StudentCheckLevel = () => {
  const [form, setForm] = useState({
    targetDomain: 'Full Stack Development',
    dsaConcepts: '',
    domainConcepts: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.dsaConcepts.trim() || !form.domainConcepts.trim()) {
      toast.error('Please enter both DSA concepts and domain concepts');
      return;
    }

    setLoading(true);
    setUsedFallback(false);

    try {
      const { data } = await api.post('/student/check-level', form);
      setResult(data);
      toast.success('Your level prediction is ready');
    } catch (_error) {
      const fallbackResult = predictStudentLevel(form);
      setResult(fallbackResult);
      setUsedFallback(true);
      toast.success('Level predicted using local AI fallback');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !result) {
    return <PageLoader label="Checking your level" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_52%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <BrainCircuit className="h-4 w-4" />
              AI Level Predictor
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Check your level from the concepts you already know and see what to study next.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Enter your DSA and domain knowledge. The AI-style predictor will place you in the
              5lpa, 7lpa, or 10lpa band and recommend the concepts needed for the next category.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Example Input</p>
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <div>
                <p className="font-semibold text-white">DSA</p>
                <p className="mt-1">{examples.dsa}</p>
              </div>
              <div>
                <p className="font-semibold text-white">Domain</p>
                <p className="mt-1">{examples.domain}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Input your concepts</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Check Your Level</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Target domain</label>
              <select
                value={form.targetDomain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetDomain: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400"
              >
                {domainOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                DSA concepts you know
              </label>
              <textarea
                value={form.dsaConcepts}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dsaConcepts: event.target.value }))
                }
                className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400"
                placeholder="Example: arrays, strings, linked list, stack, queue, sorting"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Domain concepts you know
              </label>
              <textarea
                value={form.domainConcepts}
                onChange={(event) =>
                  setForm((current) => ({ ...current, domainConcepts: event.target.value }))
                }
                className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-sky-400"
                placeholder="Example: html, css, javascript, react, node, express, mongodb"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? 'Predicting...' : 'Check my level'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    targetDomain: 'Full Stack Development',
                    dsaConcepts: examples.dsa,
                    domainConcepts: examples.domain,
                  })
                }
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Use sample
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Prediction result</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your current category</h2>

          {!result ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm leading-7 text-slate-600">
              Submit your DSA and domain concepts to get your predicted placement band and the
              concepts needed for the next jump.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-600 p-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/75">
                      Predicted category
                    </p>
                    <p className="mt-3 text-4xl font-semibold">{result.predictedCategory}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                    Readiness score: {result.readinessScore}%
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/90">{result.summary}</p>
                {usedFallback ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/75">
                    Local AI fallback used
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">DSA coverage</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{result.dsaCoverage}%</p>
                </div>
                <div className="rounded-3xl border border-slate-100 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Domain coverage</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{result.domainCoverage}%</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 text-slate-950">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-lg font-semibold">Strengths detected</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(result.strengths || []).length ? (
                    result.strengths.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Add more concepts for stronger matching.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 text-slate-950">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                  <p className="text-lg font-semibold">
                    {result.nextCategory
                      ? `Topics to move toward ${result.nextCategory}`
                      : 'Top rank status'}
                  </p>
                </div>
                {result.nextCategory ? (
                  <>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {result.recommendationMessage}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(result.nextLevelSuggestions || []).map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {result.recommendationMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentCheckLevel;
