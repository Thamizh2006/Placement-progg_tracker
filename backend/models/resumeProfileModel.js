import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
    score: { type: String, default: '' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    techStack: { type: [String], default: [] },
    link: { type: String, default: '' },
    highlights: { type: [String], default: [] },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: '' },
    year: { type: String, default: '' },
    link: { type: String, default: '' },
  },
  { _id: false }
);

const resumeProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    template: {
      type: String,
      enum: ['modern', 'minimal', 'ats'],
      default: 'ats',
    },
    targetRole: {
      type: String,
      enum: ['Software Engineer', 'Data Scientist', 'Data Analyst', 'Full Stack Developer'],
      default: 'Software Engineer',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      summary: { type: String, default: '' },
    },
    education: { type: [educationSchema], default: [] },
    skills: { type: [String], default: [] },
    projects: { type: [projectSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    sectionOrder: {
      type: [String],
      default: ['summary', 'skills', 'projects', 'experience', 'education', 'certifications'],
    },
    atsScore: { type: Number, default: 0 },
    suggestions: { type: [String], default: [] },
    analysis: {
      strengths: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      weakSections: { type: [String], default: [] },
    },
    lastGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ResumeProfile = mongoose.model('ResumeProfile', resumeProfileSchema);

export default ResumeProfile;
