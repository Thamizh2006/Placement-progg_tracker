const normalizeRows = (categoryDoc) => categoryDoc?.rows || [];

const keywordGroups = {
  'Data Structures & Algorithms': ['dsa', 'array', 'linked list', 'tree', 'graph', 'dp', 'dynamic programming', 'recursion', 'stack', 'queue'],
  Aptitude: ['aptitude', 'quant', 'probability', 'reasoning', 'speed math', 'verbal'],
  'Core Subjects': ['dbms', 'sql', 'operating system', 'os', 'cn', 'computer network', 'oops'],
  Development: ['react', 'node', 'frontend', 'backend', 'api', 'javascript', 'css', 'html', 'project'],
  Coding: ['leetcode', 'codeforces', 'coding', 'problem', 'contest'],
};

const titleToLabel = (value = '') => value.trim() || 'General';

const inferTopicFromText = (text = '') => {
  const lower = text.toLowerCase();
  const matches = Object.entries(keywordGroups)
    .map(([label, keywords]) => ({
      label,
      score: keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return matches.map((entry) => entry.label);
};

export const analyzeWeakAreas = ({ categoryDoc, progress }) => {
  const rows = normalizeRows(categoryDoc);
  const completedTasks = progress?.completedTasks || [];
  const completedTaskSet = new Set(
    completedTasks.map((task) => `${task.rowTitle}:${task.taskName}`)
  );

  const rowInsights = rows.map((row) => {
    const totalTasks = row.tasks.length;
    const completedCount = row.tasks.filter((task) =>
      completedTaskSet.has(`${row.title}:${task}`)
    ).length;
    const completionRate = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;

    return {
      label: titleToLabel(row.title),
      totalTasks,
      completedCount,
      completionRate,
      missingCount: Math.max(totalTasks - completedCount, 0),
    };
  });

  const weakAreas = rowInsights
    .filter((row) => row.totalTasks > 0)
    .sort((left, right) => left.completionRate - right.completionRate)
    .slice(0, 3)
    .map((row) => ({
      ...row,
      severity:
        row.completionRate < 35 ? 'high' : row.completionRate < 65 ? 'medium' : 'low',
      summary:
        row.completionRate < 35
          ? `${row.label} needs urgent attention`
          : `You still have room to improve in ${row.label}`,
    }));

  return {
    rowInsights,
    weakAreas: weakAreas.filter((area) => area.completionRate < 80),
  };
};

export const calculateReadiness = ({
  progress,
  categoryDoc,
  pendingDoubts = 0,
  mentorAssigned = false,
  reportCount = 0,
}) => {
  const progressPercentage = progress?.progressPercentage || 0;
  const completedTasks = progress?.completedTasks || [];
  const now = new Date();
  const recentWindow = 1000 * 60 * 60 * 24 * 21;
  const recentTaskCount = completedTasks.filter(
    (task) => now.getTime() - new Date(task.completedAt || now).getTime() <= recentWindow
  ).length;

  const { weakAreas } = analyzeWeakAreas({ categoryDoc, progress });
  const weakAreaPenalty = weakAreas.reduce((sum, area) => sum + (area.severity === 'high' ? 8 : 4), 0);
  const consistencyScore = Math.min(recentTaskCount * 6, 18);
  const mentorScore = mentorAssigned ? 8 : 0;
  const reportScore = Math.min(reportCount * 2, 6);
  const doubtPenalty = Math.min(pendingDoubts * 3, 12);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(progressPercentage * 0.72 + consistencyScore + mentorScore + reportScore - doubtPenalty - weakAreaPenalty)
    )
  );

  const improvementSuggestions = [];

  if (!mentorAssigned) {
    improvementSuggestions.push('Choose a mentor to unlock faster doubt resolution and guided follow-up.');
  }

  if (weakAreas.length) {
    improvementSuggestions.push(
      `Focus next on ${weakAreas
        .slice(0, 2)
        .map((area) => area.label)
        .join(' and ')} to raise readiness faster.`
    );
  }

  if (recentTaskCount < 2) {
    improvementSuggestions.push('Complete at least 2 fresh tasks this week to improve consistency.');
  }

  if (pendingDoubts > 0) {
    improvementSuggestions.push('Close pending doubts and convert them into completed tasks or revision notes.');
  }

  const level =
    score >= 80 ? 'High' : score >= 60 ? 'Moderate' : score >= 40 ? 'Developing' : 'Early';

  return {
    readinessScore: score,
    readinessLevel: level,
    pendingDoubts,
    weakAreas,
    consistencyScore,
    improvementSuggestions: improvementSuggestions.slice(0, 4),
  };
};

export const generateDoubtAssistance = ({
  subject,
  message,
  taskName,
  category,
  weakAreas = [],
}) => {
  const detectedTopics = inferTopicFromText(`${subject} ${message} ${taskName || ''}`);
  const fallbackTopics = weakAreas.map((area) => area.label);
  const topics = [...new Set([...detectedTopics, ...fallbackTopics])].slice(0, 3);
  const focusTopics = topics.length ? topics : ['General problem solving'];

  const hints = [
    `Restate the exact blocker in one line and list the expected output before debugging.`,
    `Break the problem into input, process, and output steps so the mentor can spot the gap quickly.`,
    `Share the smallest failing example or dry run, especially for ${focusTopics[0]}.`,
  ];

  const solutionOutline = [
    `Start from the linked task "${taskName || 'current task'}" and isolate one sub-problem at a time.`,
    `Check fundamentals around ${focusTopics.join(', ')} before jumping to a full rewrite.`,
    `Once the logic is clear, test with 2-3 edge cases and convert the fix into a completed progress task.`,
  ];

  const mentorDraft = `Try clarifying the requirement first, then solve one small part of the problem at a time. Since this looks related to ${focusTopics.join(
    ' and '
  )}, begin with the base concept, verify a dry run, and then test edge cases before finalizing the code or answer.`;

  return {
    detectedTopics: focusTopics,
    hints,
    solutionOutline,
    mentorDraft,
    summary: `AI sees this doubt as mainly related to ${focusTopics.join(', ')} in the ${category || 'general'} track.`,
  };
};

export const rankMentors = async ({
  facultyMembers = [],
  studentProgress,
  categoryDoc,
  facultyStudentsMap = new Map(),
  progressByStudentId = new Map(),
}) => {
  const { weakAreas } = analyzeWeakAreas({ categoryDoc, progress: studentProgress });

  const ranked = facultyMembers.map((faculty) => {
    const assignedStudents = facultyStudentsMap.get(String(faculty._id)) || [];
    const studentProgressEntries = assignedStudents
      .map((student) => progressByStudentId.get(String(student._id)))
      .filter(Boolean);

    const averageProgress = studentProgressEntries.length
      ? Math.round(
          studentProgressEntries.reduce(
            (sum, progress) => sum + (progress.progressPercentage || 0),
            0
          ) / studentProgressEntries.length
        )
      : 0;

    const eligibleCount = studentProgressEntries.filter(
      (progress) => (progress.progressPercentage || 0) >= 75
    ).length;
    const successRate = assignedStudents.length
      ? Math.round((eligibleCount / assignedStudents.length) * 100)
      : 0;
    const loadPenalty = Math.min(assignedStudents.length * 4, 36);
    const weakAreaBonus = weakAreas.length ? Math.max(18 - weakAreas.length * 3, 8) : 16;
    const score = Math.max(
      0,
      Math.round(averageProgress * 0.45 + successRate * 0.35 + weakAreaBonus - loadPenalty + 25)
    );

    const reasons = [
      averageProgress
        ? `Current mentees average ${averageProgress}% progress.`
        : 'Has room to take focused mentoring ownership.',
      assignedStudents.length <= 3
        ? 'Low mentoring load can improve response speed.'
        : `${assignedStudents.length} students already assigned.`,
      weakAreas.length
        ? `Good fit to support your weaker areas: ${weakAreas
            .slice(0, 2)
            .map((area) => area.label)
            .join(', ')}.`
        : 'Balanced fit for general placement preparation.',
    ];

    return {
      _id: faculty._id,
      email: faculty.email,
      department: faculty.department,
      assignedStudentsCount: assignedStudents.length,
      averageProgress,
      successRate,
      recommendationScore: Math.min(score, 100),
      reasons,
      suggestedFor: weakAreas.map((area) => area.label).slice(0, 2),
    };
  });

  return ranked.sort((left, right) => right.recommendationScore - left.recommendationScore);
};

export const getAtRiskReason = ({ progress, readiness }) => {
  const reasons = [];

  if (!progress) {
    reasons.push('No progress record yet');
  } else {
    if ((progress.progressPercentage || 0) < 50) {
      reasons.push('Low progress completion');
    }

    const lastTask = [...(progress.completedTasks || [])]
      .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt))[0];

    if (!lastTask) {
      reasons.push('No completed tasks logged');
    } else {
      const daysSinceLastTask = Math.round(
        (Date.now() - new Date(lastTask.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastTask > 14) {
        reasons.push(`No task updates in ${daysSinceLastTask} days`);
      }
    }
  }

  if ((readiness?.readinessScore || 0) < 55) {
    reasons.push('Placement readiness below threshold');
  }

  return reasons.slice(0, 3);
};
