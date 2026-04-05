import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import usePolling from '../../hooks/usePolling';
import api from '../../utils/api';
import {
  exportStaffPerformancePdf,
  exportStudentPerformancePdf,
} from '../../utils/pdfExport';

const DEPARTMENTS = ['ALL', 'CSE', 'ECE', 'EEE', 'MECH', 'IT', 'ADS', 'CYBER SECURITY', 'CHEMICAL', 'BIOTECHNOLOGY'];
const CATEGORIES = ['ALL', '5lpa', '7lpa', '10lpa'];
const CATEGORY_LABELS = {
  ALL: 'All Categories',
  '5lpa': 'Up to 5 LPA',
  '7lpa': 'Up to 7 LPA',
  '10lpa': '10+ LPA',
};

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category;

const AdminReports = () => {
  const { role } = useAuth();
  const isSuperadmin = role === 'superadmin';
  const [filters, setFilters] = useState({
    department: 'ALL',
    category: 'ALL',
    eligible: 'ALL',
  });
  const [reportRows, setReportRows] = useState([]);
  const [facultyRows, setFacultyRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    const params = {};
    if (filters.department !== 'ALL') {
      params.department = filters.department;
    }
    if (filters.category !== 'ALL') {
      params.category = filters.category;
    }
    if (filters.eligible !== 'ALL') {
      params.eligible = filters.eligible;
    }

    const [reportsResponse, facultyResponse] = await Promise.all([
      api.get('/admin/reports', { params }),
      api.get('/admin/faculty', {
        params: filters.department !== 'ALL' ? { department: filters.department } : {},
      }),
    ]);

    setReportRows(reportsResponse.data?.reports || []);
    setFacultyRows(facultyResponse.data || []);
  }, [filters.category, filters.department, filters.eligible]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadReports();
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadReports]);

  usePolling(() => {
    loadReports().catch(() => null);
  }, 18000, true);

  const studentExportRows = useMemo(
    () =>
      reportRows.map((report) => ({
        email: report.student.email,
        department: report.student.department,
        category: getCategoryLabel(report.category),
        progressPercentage: report.progressPercentage,
        eligible: report.eligible,
        mentor: report.student.assignedFaculty?.email || 'Unassigned',
      })),
    [reportRows]
  );

  const staffExportRows = useMemo(
    () =>
      facultyRows.map((member) => ({
        email: member.email,
        role: 'faculty',
        department: member.department,
        assignedStudentsCount: member.assignedStudentsCount || 0,
        eligibleStudentsCount: member.eligibleStudentsCount || 0,
        readinessRate: member.assignedStudentsCount
          ? Math.round((member.eligibleStudentsCount / member.assignedStudentsCount) * 100)
          : 0,
      })),
    [facultyRows]
  );

  const summary = useMemo(() => {
    const eligibleCount = reportRows.filter((report) => report.eligible).length;
    const averageProgress = reportRows.length
      ? Math.round(
          reportRows.reduce((sum, report) => sum + (report.progressPercentage || 0), 0) /
            reportRows.length
        )
      : 0;

    return {
      total: reportRows.length,
      eligibleCount,
      averageProgress,
    };
  }, [reportRows]);

  if (loading) {
    return <PageLoader label="Loading reports" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,237,100,0.18),_transparent_28%),linear-gradient(135deg,_#08130F_0%,_#0D1F1B_55%,_#12332A_100%)] p-8 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <FileSpreadsheet className="h-4 w-4" />
              Realtime Reports
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
              Filter, review, and export student performance reports.
            </h1>
            <p className="mt-4 text-base text-slate-300">
              This page stays synced with live backend data so placement leaders can review current
              readiness and export curated PDF reports on demand.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                exportStudentPerformancePdf({
                  rows: studentExportRows,
                  scopeLabel: filters.department === 'ALL' ? 'filtered system view' : filters.department,
                })
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Student PDF
            </button>
            {isSuperadmin && (
              <button
                type="button"
                onClick={() =>
                  exportStaffPerformancePdf({
                    rows: staffExportRows,
                    scopeLabel: filters.department === 'ALL' ? 'filtered system view' : filters.department,
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Download className="h-4 w-4" />
                Staff PDF
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Filters</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Refine report scope</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Department
              <select
                value={filters.department}
                onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Category
              <select
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Eligibility
              <select
                value={filters.eligible}
                onChange={(event) => setFilters((current) => ({ ...current, eligible: event.target.value }))}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="ALL">ALL</option>
                <option value="true">Eligible</option>
                <option value="false">Needs attention</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { label: 'Reports In View', value: summary.total, detail: 'Current filtered rows' },
            { label: 'Eligible Students', value: summary.eligibleCount, detail: 'Ready for placement' },
            { label: 'Average Progress', value: `${summary.averageProgress}%`, detail: 'Across current filter' },
          ].map((card) => (
            <div key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{card.value}</p>
              <p className="mt-4 text-sm text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Student Rows</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Live report board</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Student</th>
                <th className="pb-3 pr-4 font-semibold">Department</th>
                <th className="pb-3 pr-4 font-semibold">Category</th>
                <th className="pb-3 pr-4 font-semibold">Progress</th>
                <th className="pb-3 pr-4 font-semibold">Eligible</th>
                <th className="pb-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map((report) => (
                <tr key={report.student._id} className="text-sm text-slate-700">
                  <td className="py-4 pr-4 font-medium text-slate-900">{report.student.email}</td>
                  <td className="py-4 pr-4">{report.student.department}</td>
                  <td className="py-4 pr-4">{getCategoryLabel(report.category)}</td>
                  <td className="py-4 pr-4">{report.progressPercentage}%</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        report.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {report.eligible ? 'Eligible' : 'Needs work'}
                    </span>
                  </td>
                  <td className="py-4">{new Date(report.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminReports;
