import CodingProfile from '../models/codingProfileModel.js';
import Progress from '../models/progressModel.js';
import Category from '../models/categoryModel.js';
import ResumeProfile from '../models/resumeProfileModel.js';
import TestSubmission from '../models/testSubmissionModel.js';
import User from '../models/userModel.js';
import { analyzeResumeProfile, buildResumeFromSources } from '../utils/resumeEngine.js';

const getRoleReadyResume = async (studentId) => {
  const [user, progress, codingProfile, submissions, resume] = await Promise.all([
    User.findById(studentId).select('email department selectedCategory'),
    Progress.findOne({ student: studentId }),
    CodingProfile.findOne({ student: studentId }),
    TestSubmission.find({
      student: studentId,
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .populate('test', 'title')
      .sort({ submittedAt: -1 })
      .limit(5),
    ResumeProfile.findOne({ student: studentId }),
  ]);

  const categoryDoc = progress?.category
    ? await Category.findOne({ name: progress.category })
    : null;

  const testReadinessScore = submissions.length
    ? Math.round(
        submissions.reduce((sum, submission) => sum + (submission.accuracy || 0), 0) /
          submissions.length
      )
    : 0;
  const codingReadinessScore = codingProfile?.placementReadinessScore || 0;

  const mergedResume = buildResumeFromSources({
    user,
    progress,
    categoryDoc,
    codingProfile,
    submissions,
    existingResume: resume,
  });

  const analysis = analyzeResumeProfile({
    resume: mergedResume,
    targetRole: resume?.targetRole || 'Software Engineer',
    testReadinessScore,
    codingReadinessScore,
  });

  return {
    user,
    mergedResume,
    analysis,
    testReadinessScore,
    codingReadinessScore,
  };
};

export const getMyResume = async (req, res) => {
  try {
    const { mergedResume, analysis } = await getRoleReadyResume(req.user._id);
    res.json({ ...mergedResume, ...analysis });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const autoGenerateResume = async (req, res) => {
  try {
    const { mergedResume, analysis } = await getRoleReadyResume(req.user._id);

    const saved = await ResumeProfile.findOneAndUpdate(
      { student: req.user._id },
      {
        student: req.user._id,
        ...mergedResume,
        atsScore: analysis.atsScore,
        suggestions: analysis.suggestions,
        analysis: {
          strengths: analysis.strengths,
          missingKeywords: analysis.missingKeywords,
          weakSections: analysis.weakSections,
        },
        lastGeneratedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveMyResume = async (req, res) => {
  try {
    const payload = req.body || {};
    const current = await ResumeProfile.findOne({ student: req.user._id });

    const nextResume = {
      student: req.user._id,
      template: payload.template || current?.template || 'ats',
      targetRole: payload.targetRole || current?.targetRole || 'Software Engineer',
      personalInfo: payload.personalInfo || current?.personalInfo || {},
      education: payload.education || current?.education || [],
      skills: payload.skills || current?.skills || [],
      projects: payload.projects || current?.projects || [],
      experience: payload.experience || current?.experience || [],
      certifications: payload.certifications || current?.certifications || [],
      sectionOrder: payload.sectionOrder || current?.sectionOrder || [],
    };

    const [submissions, codingProfile] = await Promise.all([
      TestSubmission.find({
        student: req.user._id,
        status: { $in: ['submitted', 'auto_submitted'] },
      }),
      CodingProfile.findOne({ student: req.user._id }),
    ]);

    const analysis = analyzeResumeProfile({
      resume: nextResume,
      targetRole: nextResume.targetRole,
      testReadinessScore: submissions.length
        ? Math.round(
            submissions.reduce((sum, submission) => sum + (submission.accuracy || 0), 0) /
              submissions.length
          )
        : 0,
      codingReadinessScore: codingProfile?.placementReadinessScore || 0,
    });

    const saved = await ResumeProfile.findOneAndUpdate(
      { student: req.user._id },
      {
        ...nextResume,
        atsScore: analysis.atsScore,
        suggestions: analysis.suggestions,
        analysis: {
          strengths: analysis.strengths,
          missingKeywords: analysis.missingKeywords,
          weakSections: analysis.weakSections,
        },
        lastGeneratedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzeMyResume = async (req, res) => {
  try {
    const resume = await ResumeProfile.findOne({ student: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume profile not found' });
    }

    const [submissions, codingProfile] = await Promise.all([
      TestSubmission.find({
        student: req.user._id,
        status: { $in: ['submitted', 'auto_submitted'] },
      }),
      CodingProfile.findOne({ student: req.user._id }),
    ]);

    const analysis = analyzeResumeProfile({
      resume,
      targetRole: resume.targetRole,
      testReadinessScore: submissions.length
        ? Math.round(
            submissions.reduce((sum, submission) => sum + (submission.accuracy || 0), 0) /
              submissions.length
          )
        : 0,
      codingReadinessScore: codingProfile?.placementReadinessScore || 0,
    });

    resume.atsScore = analysis.atsScore;
    resume.suggestions = analysis.suggestions;
    resume.analysis = {
      strengths: analysis.strengths,
      missingKeywords: analysis.missingKeywords,
      weakSections: analysis.weakSections,
    };
    await resume.save();

    res.json({ ...resume.toObject(), ...analysis });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResumeAnalytics = async (_req, res) => {
  try {
    const resumes = await ResumeProfile.find().populate('student', 'email department');

    const summary = {
      totalResumes: resumes.length,
      averageAtsScore: resumes.length
        ? Math.round(resumes.reduce((sum, resume) => sum + (resume.atsScore || 0), 0) / resumes.length)
        : 0,
      roleTargets: resumes.reduce((accumulator, resume) => {
        accumulator[resume.targetRole] = (accumulator[resume.targetRole] || 0) + 1;
        return accumulator;
      }, {}),
    };

    const topResumes = resumes
      .map((resume) => ({
        student: resume.student?.email || 'Student',
        department: resume.student?.department || 'Unknown',
        atsScore: resume.atsScore || 0,
        targetRole: resume.targetRole,
        template: resume.template,
      }))
      .sort((left, right) => right.atsScore - left.atsScore)
      .slice(0, 10);

    res.json({ summary, topResumes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
