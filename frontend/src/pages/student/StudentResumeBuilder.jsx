import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import api from '../../utils/api';

const emptyResume = {
  template: 'ats',
  targetRole: 'Software Engineer',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
  },
  education: [],
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
  atsScore: 0,
  suggestions: [],
  analysis: {
    strengths: [],
    missingKeywords: [],
    weakSections: [],
  },
};

const createEducation = () => ({ institution: '', degree: '', startYear: '', endYear: '', score: '' });
const createProject = () => ({ title: '', description: '', techStack: '', link: '', highlights: '' });
const createExperience = () => ({ role: '', company: '', duration: '', description: '' });
const createCertification = () => ({ name: '', issuer: '', year: '', link: '' });

const StudentResumeBuilder = () => {
  const [resume, setResume] = useState(emptyResume);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadResume = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await api.get('/resume/my');
      setResume({ ...emptyResume, ...data });
    } catch {
      setResume(emptyResume);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResume(true);
  }, []);

  const generateResume = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/resume/generate');
      setResume({ ...emptyResume, ...data });
      toast.success('Resume generated from your profile data');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to auto-generate resume');
    } finally {
      setSaving(false);
    }
  };

  const saveResume = async () => {
    setSaving(true);
    try {
      const payload = {
        ...resume,
        skills: typeof resume.skills === 'string'
          ? resume.skills.split(',').map((item) => item.trim()).filter(Boolean)
          : resume.skills,
        projects: resume.projects.map((project) => ({
          ...project,
          techStack: typeof project.techStack === 'string'
            ? project.techStack.split(',').map((item) => item.trim()).filter(Boolean)
            : project.techStack,
          highlights: typeof project.highlights === 'string'
            ? project.highlights.split('\n').map((item) => item.trim()).filter(Boolean)
            : project.highlights,
        })),
      };
      const { data } = await api.put('/resume/my', payload);
      setResume({ ...emptyResume, ...data });
      toast.success('Resume saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const analyzeResume = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/resume/analyze');
      setResume({ ...emptyResume, ...data });
      toast.success('Resume analyzed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze resume');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    const addBlock = (title, lines) => {
      doc.setFontSize(14);
      doc.text(title, 14, y);
      y += 8;
      doc.setFontSize(10);
      const wrapped = doc.splitTextToSize(lines.filter(Boolean).join('\n'), 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 5 + 6;
    };

    doc.setFontSize(18);
    doc.text(resume.personalInfo.fullName || 'Resume', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(
      [resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location].filter(Boolean).join(' | '),
      14,
      y
    );
    y += 10;

    addBlock('Summary', [resume.personalInfo.summary]);
    addBlock('Skills', [Array.isArray(resume.skills) ? resume.skills.join(', ') : resume.skills]);
    addBlock('Projects', resume.projects.map((project) => `${project.title}: ${project.description}`));
    addBlock('Experience', resume.experience.map((item) => `${item.role} ${item.company} ${item.duration} ${item.description}`));
    addBlock('Education', resume.education.map((item) => `${item.degree} - ${item.institution} (${item.startYear}-${item.endYear}) ${item.score}`));
    addBlock('Certifications', resume.certifications.map((item) => `${item.name} - ${item.issuer} ${item.year}`));

    doc.save(`${(resume.personalInfo.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const updateCollection = (key, index, field, value) => {
    setResume((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  if (loading) {
    return <PageLoader label="Loading resume builder" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_25%),linear-gradient(135deg,_#08130F_0%,_#102427_45%,_#15383D_100%)] p-8 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              Smart Resume Builder
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Build, score, and export a placement-ready resume from your academic profile.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={generateResume} disabled={saving} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
              Auto-generate
            </button>
            <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {['fullName', 'email', 'phone', 'location', 'linkedin', 'github'].map((key) => (
              <input
                key={key}
                value={resume.personalInfo[key] || ''}
                onChange={(event) =>
                  setResume((current) => ({
                    ...current,
                    personalInfo: { ...current.personalInfo, [key]: event.target.value },
                  }))
                }
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder={key}
              />
            ))}
            <textarea
              value={resume.personalInfo.summary || ''}
              onChange={(event) =>
                setResume((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, summary: event.target.value },
                }))
              }
              className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Professional summary"
            />
            <input
              value={Array.isArray(resume.skills) ? resume.skills.join(', ') : resume.skills}
              onChange={(event) => setResume((current) => ({ ...current, skills: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Skills (comma separated)"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select value={resume.template} onChange={(event) => setResume((current) => ({ ...current, template: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="ats">ATS-friendly</option>
              </select>
              <select value={resume.targetRole} onChange={(event) => setResume((current) => ({ ...current, targetRole: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="Software Engineer">Software Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-sky-600" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">ATS Insights</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Resume score</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">ATS Score</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{resume.atsScore || 0}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Target Role</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{resume.targetRole}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Template</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-950">{resume.template}</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-900">Suggestions</p>
              <div className="mt-3 space-y-2">
                {(resume.suggestions || []).map((tip) => (
                  <p key={tip} className="text-sm text-slate-600">{tip}</p>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-900">Missing keywords</p>
              <p className="mt-3 text-sm text-slate-600">
                {(resume.analysis?.missingKeywords || []).join(', ') || 'No major keyword gaps detected.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={saveResume} disabled={saving} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">
                {saving ? 'Saving...' : 'Save resume'}
              </button>
              <button type="button" onClick={analyzeResume} disabled={saving} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                Analyze now
              </button>
              <button type="button" onClick={() => loadResume(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {[
          ['education', 'Education', createEducation],
          ['projects', 'Projects', createProject],
          ['experience', 'Experience', createExperience],
          ['certifications', 'Certifications', createCertification],
        ].map(([key, label, factory]) => (
          <div key={key} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Edit {label.toLowerCase()}</h2>
              </div>
              <button type="button" onClick={() => setResume((current) => ({ ...current, [key]: [...current[key], factory()] }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                Add
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {resume[key].map((entry, index) => (
                <div key={`${key}-${index}`} className="rounded-3xl bg-slate-50 p-4">
                  {Object.keys(entry).map((field) => (
                    <textarea
                      key={field}
                      value={Array.isArray(entry[field]) ? entry[field].join(field === 'highlights' ? '\n' : ', ') : entry[field]}
                      onChange={(event) => updateCollection(key, index, field, event.target.value)}
                      className="mb-3 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder={field}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default StudentResumeBuilder;
