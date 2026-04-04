import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, CheckCircle2, Download, RefreshCw, Target } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import api from '../utils/api';
import usePolling from '../hooks/usePolling';

const StudentProgress = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryData, setCategoryData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [updatingTask, setUpdatingTask] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [proofs, setProofs] = useState({});

  const loadData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [categoriesResponse, eligibilityResponse, readinessResponse] = await Promise.all([
        api.get('/progress/categories'),
        api.get('/student/check-eligibility').catch(() => ({ data: null })),
        api.get('/student/readiness-insights').catch(() => ({ data: null })),
      ]);

      setCategories(categoriesResponse.data);
      setEligibility(eligibilityResponse.data);
      setReadiness(readinessResponse.data);

      try {
        const progressResponse = await api.get('/student/my-progress');
        setProgress(progressResponse.data.progress);
        setCategoryData(progressResponse.data.category);
        setSelectedCategory(progressResponse.data.progress.category);
      } catch (error) {
        if (error.response?.status === 404) {
          setProgress(null);
          setCategoryData(null);
          setSelectedCategory('');
        } else {
          throw error;
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load progress data');
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

  const handleCategorySelect = async () => {
    if (!selectedCategory) {
      toast.error('Select a category first');
      return;
    }

    setSavingCategory(true);
    try {
      await api.post('/student/select-category', { category: selectedCategory });
      toast.success('Category selected successfully');
      await loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to select category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleTaskUpdate = async (rowTitle, taskName) => {
    const proof = proofs[`${rowTitle}:${taskName}`];
    setUpdatingTask(`${rowTitle}:${taskName}`);

    try {
      await api.post('/student/update-task', {
        rowTitle,
        taskName,
        proofUrl: proof?.proofUrl || null,
        proofType: proof?.proofType || null,
      });
      toast.success('Task marked as completed');
      await loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdatingTask('');
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await api.post('/student/generate-report');
      toast.success('Report generated successfully');
      await loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const completedTasks = new Set(
    (progress?.completedTasks || []).map((task) => `${task.rowTitle}:${task.taskName}`)
  );

  if (loading) {
    return <PageLoader label="Loading progress" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Progress</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Realtime task tracking</h1>
          <p className="mt-2 text-slate-600">
            Choose a category, update completed tasks, and watch eligibility refresh live.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={!progress || generatingReport}
            className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Download className="mr-2 h-4 w-4" />
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Category</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Select your target package</h2>
            <div className="mt-5 space-y-3">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCategorySelect}
                disabled={!selectedCategory || savingCategory}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingCategory ? 'Saving category...' : 'Save category'}
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Eligibility</p>
            <div className="mt-4 flex items-start gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  eligibility?.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Target className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {eligibility?.eligible ? 'Eligible' : 'Not eligible yet'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {eligibility?.message || 'Select a category to begin'}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {eligibility?.completedTasks || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {eligibility?.percentage || 0}%
                </p>
              </div>
            </div>
            {readiness && (
              <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-5">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="h-5 w-5 text-sky-700" />
                  <div>
                    <p className="text-sm font-semibold text-sky-800">Predictive placement readiness</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      You have {readiness.readinessScore}% placement readiness
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {(readiness.improvementSuggestions || []).map((tip) => (
                    <p key={tip} className="text-sm leading-6 text-slate-600">
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Task Board</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {categoryData ? `${categoryData.name} roadmap` : 'Choose a category to start'}
          </h2>

          {!categoryData ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-slate-600">
              No category selected yet. Choose one from the left panel.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {!!readiness?.weakAreas?.length && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">Weak area detection</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {readiness.weakAreas.map((area) => (
                      <span
                        key={area.label}
                        className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700"
                      >
                        {area.label} {area.completionRate}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {categoryData.rows.map((row) => (
                <div key={row.title} className="rounded-3xl border border-slate-100">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">{row.title}</h3>
                  </div>
                  <div className="space-y-4 p-5">
                    {row.tasks.map((taskName) => {
                      const taskKey = `${row.title}:${taskName}`;
                      const isDone = completedTasks.has(taskKey);
                      return (
                        <div key={taskKey} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{taskName}</p>
                                <p className="text-sm text-slate-500">
                                  {isDone ? 'Completed' : 'Pending completion'}
                                </p>
                              </div>
                            </div>
                            {!isDone && (
                              <button
                                onClick={() => handleTaskUpdate(row.title, taskName)}
                                disabled={updatingTask === taskKey}
                                className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                              >
                                {updatingTask === taskKey ? 'Updating...' : 'Mark complete'}
                              </button>
                            )}
                          </div>
                          {!isDone && (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <input
                                type="text"
                                value={proofs[taskKey]?.proofUrl || ''}
                                onChange={(event) =>
                                  setProofs((current) => ({
                                    ...current,
                                    [taskKey]: {
                                      ...current[taskKey],
                                      proofUrl: event.target.value,
                                    },
                                  }))
                                }
                                className="rounded-2xl border border-slate-200 px-4 py-3"
                                placeholder="Optional proof URL"
                              />
                              <select
                                value={proofs[taskKey]?.proofType || ''}
                                onChange={(event) =>
                                  setProofs((current) => ({
                                    ...current,
                                    [taskKey]: {
                                      ...current[taskKey],
                                      proofType: event.target.value || null,
                                    },
                                  }))
                                }
                                className="rounded-2xl border border-slate-200 px-4 py-3"
                              >
                                <option value="">No proof type</option>
                                <option value="screenshot">Screenshot</option>
                                <option value="document">Document</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
