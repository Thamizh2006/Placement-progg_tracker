import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileBarChart2, RefreshCw } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';
import usePolling from '../../hooks/usePolling';

const StudentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadReports = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/report/my');
      setReports(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(true);
  }, []);

  usePolling(() => {
    loadReports(false);
  }, 15000, true);

  const generateReport = async () => {
    setGenerating(true);
    try {
      await api.post('/report/generate');
      toast.success('Report generated successfully');
      await loadReports(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading reports" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Reports</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Track generated reports</h1>
          <p className="mt-2 text-slate-600">
            Generate a fresh report any time and review the latest progress snapshots.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadReports(true)}
            className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={generateReport}
            disabled={generating}
            className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Download className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate report'}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileBarChart2 className="h-6 w-6 text-sky-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Report history</h2>
        </div>
        <div className="mt-6 space-y-4">
          {reports.length === 0 && (
            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
              No reports generated yet.
            </div>
          )}
          {reports.map((report) => (
            <div key={report._id} className="rounded-3xl border border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{report.category}</p>
                  <p className="mt-1 text-sm text-slate-500">{report.type} report</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    report.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {report.eligible ? 'Eligible' : 'Not eligible'}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Progress</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {report.progressPercentage}%
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Completed tasks</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {report.completedTaskCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total tasks</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{report.totalTasks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentReports;
