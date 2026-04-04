const ROLE_KEYWORDS = {
  'Software Engineer': ['dsa', 'javascript', 'react', 'node', 'api', 'leetcode', 'project'],
  'Data Scientist': ['python', 'statistics', 'machine learning', 'sql', 'data', 'analysis'],
  'Data Analyst': ['sql', 'excel', 'dashboard', 'python', 'analytics', 'visualization'],
  'Full Stack Developer': ['react', 'node', 'api', 'database', 'frontend', 'backend'],
};

export const buildResumeFromSources = ({
  user,
  progress,
  categoryDoc,
  codingProfile,
  submissions,
  existingResume,
}) => {
  const inferredSkills = new Set(existingResume?.skills || []);

  for (const row of categoryDoc?.rows || []) {
    inferredSkills.add(row.title);
  }

  if ((codingProfile?.leetCode?.totalSolved || 0) > 0) {
    inferredSkills.add('Problem Solving');
    inferredSkills.add('LeetCode');
  }

  if ((codingProfile?.codeforces?.rating || 0) > 0) {
    inferredSkills.add('Competitive Programming');
  }

  const strongTests = (submissions || [])
    .filter((submission) => submission.accuracy >= 70)
    .slice(0, 2)
    .map((submission, index) => ({
      title: `Assessment Highlight ${index + 1}`,
      description: `Achieved ${submission.accuracy}% accuracy in ${submission.test?.title || 'a placement assessment'}.`,
      techStack: submission.topicBreakdown?.map((item) => item.tag).slice(0, 4) || [],
      link: '',
      highlights: [
        `Score: ${submission.totalScore}/${submission.maxScore}`,
        `Accuracy: ${submission.accuracy}%`,
      ],
    }));

  return {
    ...existingResume,
    personalInfo: {
      fullName:
        existingResume?.personalInfo?.fullName ||
        user.email.split('@')[0].replace(/[._-]/g, ' '),
      email: user.email,
      phone: existingResume?.personalInfo?.phone || '',
      location: existingResume?.personalInfo?.location || '',
      linkedin: existingResume?.personalInfo?.linkedin || '',
      github: existingResume?.personalInfo?.github || '',
      summary:
        existingResume?.personalInfo?.summary ||
        `Placement-focused ${user.department} student working toward ${progress?.category || user.selectedCategory || 'career'} opportunities.`,
    },
    education:
      existingResume?.education?.length
        ? existingResume.education
        : [
            {
              institution: `${user.department} Department`,
              degree: 'B.Tech / Undergraduate',
              startYear: '',
              endYear: '',
              score: '',
            },
          ],
    skills: [...inferredSkills].filter(Boolean).slice(0, 12),
    projects: existingResume?.projects?.length ? existingResume.projects : strongTests,
    experience: existingResume?.experience || [],
    certifications: existingResume?.certifications || [],
    sectionOrder: existingResume?.sectionOrder || [
      'summary',
      'skills',
      'projects',
      'experience',
      'education',
      'certifications',
    ],
  };
};

export const analyzeResumeProfile = ({ resume, targetRole, testReadinessScore, codingReadinessScore }) => {
  const keywords = ROLE_KEYWORDS[targetRole] || ROLE_KEYWORDS['Software Engineer'];
  const aggregateText = [
    resume.personalInfo?.summary,
    ...(resume.skills || []),
    ...(resume.projects || []).map((project) => `${project.title} ${project.description} ${(project.techStack || []).join(' ')}`),
    ...(resume.experience || []).map((item) => `${item.role} ${item.description}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedKeywords = keywords.filter((keyword) => aggregateText.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !aggregateText.includes(keyword));
  const sectionCoverage = [
    resume.personalInfo?.summary ? 1 : 0,
    resume.skills?.length ? 1 : 0,
    resume.projects?.length ? 1 : 0,
    resume.education?.length ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  const atsScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        matchedKeywords.length * 8 +
          sectionCoverage * 12 +
          Math.min((resume.projects?.length || 0) * 6, 18) +
          (testReadinessScore || 0) * 0.18 +
          (codingReadinessScore || 0) * 0.16
      )
    )
  );

  const weakSections = [];
  if (!resume.personalInfo?.summary) weakSections.push('Professional summary');
  if ((resume.projects || []).length === 0) weakSections.push('Projects');
  if ((resume.skills || []).length < 5) weakSections.push('Skills');
  if ((resume.education || []).length === 0) weakSections.push('Education');

  const suggestions = [];
  if (missingKeywords.length) {
    suggestions.push(`Add role-specific keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);
  }
  if ((resume.projects || []).length < 2) {
    suggestions.push('Add at least 2 strong projects with measurable impact and tech stack details.');
  }
  if ((resume.skills || []).length < 6) {
    suggestions.push('Expand the skills section with technical, domain, and tool-based skills.');
  }
  if (!resume.personalInfo?.summary) {
    suggestions.push('Write a concise summary focused on placement readiness and your target role.');
  }

  return {
    atsScore,
    strengths: [
      matchedKeywords.length
        ? `Good keyword coverage for ${targetRole}.`
        : `Resume needs stronger ${targetRole} keyword alignment.`,
      testReadinessScore >= 60
        ? 'Assessment performance supports the resume profile.'
        : 'Assessment performance should be improved to strengthen the profile.',
      codingReadinessScore >= 60
        ? 'Coding activity adds placement credibility.'
        : 'Coding consistency is still limited.',
    ],
    missingKeywords,
    weakSections,
    suggestions,
  };
};
