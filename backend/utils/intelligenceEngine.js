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

const normalizeConcepts = (value = []) =>
  (Array.isArray(value) ? value : String(value).split(/[\n,]/))
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);

const conceptMatches = (knownConcepts, expectedConcepts) =>
  expectedConcepts.filter((concept) =>
    knownConcepts.some(
      (known) => known.includes(concept.toLowerCase()) || concept.toLowerCase().includes(known)
    )
  );

const dsaBuckets = {
  '5lpa': [
    'arrays',
    'strings',
    'linked list',
    'stack',
    'queue',
    'sorting',
    'searching',
    'recursion',
    'time complexity',
  ],
  '7lpa': [
    'binary search',
    'trees',
    'binary tree',
    'heap',
    'hashing',
    'greedy',
    'sliding window',
    'two pointers',
    'backtracking',
  ],
  '10lpa': [
    'graph',
    'dynamic programming',
    'trie',
    'segment tree',
    'shortest path',
    'union find',
    'advanced dp',
    'memoization',
    'topological sort',
  ],
};

const domainBuckets = {
  'Full Stack Development': {
    '5lpa': ['html', 'css', 'javascript', 'react', 'node', 'express', 'mongodb', 'rest api'],
    '7lpa': ['redux', 'authentication', 'jwt', 'sql', 'testing', 'deployment', 'git', 'api integration'],
    '10lpa': ['system design', 'microservices', 'docker', 'caching', 'web security', 'scalability', 'ci/cd'],
  },
  'Data Science': {
    '5lpa': ['python', 'numpy', 'pandas', 'matplotlib', 'statistics', 'data cleaning', 'excel'],
    '7lpa': ['machine learning', 'classification', 'regression', 'feature engineering', 'model evaluation', 'sql'],
    '10lpa': ['deep learning', 'nlp', 'time series', 'mlops', 'model deployment', 'optimization'],
  },
  'Java Backend': {
    '5lpa': ['java', 'oops', 'collections', 'jdbc', 'sql', 'spring boot', 'rest api'],
    '7lpa': ['jpa', 'hibernate', 'authentication', 'multithreading', 'unit testing', 'redis'],
    '10lpa': ['system design', 'microservices', 'kafka', 'docker', 'kubernetes', 'performance tuning'],
  },
  'Python Development': {
    '5lpa': ['python', 'oops', 'flask', 'django', 'sql', 'api', 'git'],
    '7lpa': ['django rest framework', 'authentication', 'testing', 'celery', 'redis', 'deployment'],
    '10lpa': ['system design', 'async programming', 'microservices', 'docker', 'monitoring', 'scalability'],
  },
  'Core CS / General': {
    '5lpa': ['dbms', 'sql', 'os', 'computer networks', 'oops', 'c programming'],
    '7lpa': ['normalization', 'transactions', 'process synchronization', 'tcp/ip', 'operating system internals', 'java'],
    '10lpa': ['system design', 'distributed systems', 'concurrency', 'network security', 'cloud basics'],
  },
};

const salaryOrder = ['5lpa', '7lpa', '10lpa'];

const getCoverage = (knownConcepts, expectedConcepts = []) => {
  const matched = conceptMatches(knownConcepts, expectedConcepts);
  const percentage = expectedConcepts.length
    ? Math.round((matched.length / expectedConcepts.length) * 100)
    : 0;

  return {
    matched,
    percentage,
  };
};

export const evaluateStudentLevel = ({
  dsaConcepts = [],
  domainConcepts = [],
  targetDomain = 'Full Stack Development',
}) => {
  const normalizedDsaConcepts = normalizeConcepts(dsaConcepts);
  const normalizedDomainConcepts = normalizeConcepts(domainConcepts);
  const selectedDomain = domainBuckets[targetDomain] ? targetDomain : 'Full Stack Development';

  const coverageByLevel = salaryOrder.map((level) => {
    const dsaCoverage = getCoverage(normalizedDsaConcepts, dsaBuckets[level]);
    const domainCoverage = getCoverage(normalizedDomainConcepts, domainBuckets[selectedDomain][level]);
    const combinedScore = Math.round(dsaCoverage.percentage * 0.55 + domainCoverage.percentage * 0.45);

    return {
      level,
      dsaCoverage,
      domainCoverage,
      combinedScore,
    };
  });

  let predictedCategory = '5lpa';
  if (coverageByLevel[2].combinedScore >= 60) {
    predictedCategory = '10lpa';
  } else if (coverageByLevel[1].combinedScore >= 55) {
    predictedCategory = '7lpa';
  }

  const currentCoverage = coverageByLevel.find((entry) => entry.level === predictedCategory);
  const nextCategory =
    predictedCategory === '5lpa' ? '7lpa' : predictedCategory === '7lpa' ? '10lpa' : null;

  const missingDsaForNext = nextCategory
    ? dsaBuckets[nextCategory].filter(
        (concept) => !conceptMatches(normalizedDsaConcepts, [concept]).length
      )
    : [];

  const missingDomainForNext = nextCategory
    ? domainBuckets[selectedDomain][nextCategory].filter(
        (concept) => !conceptMatches(normalizedDomainConcepts, [concept]).length
      )
    : [];

  const strengths = [
    ...currentCoverage.dsaCoverage.matched,
    ...currentCoverage.domainCoverage.matched,
  ].slice(0, 8);

  const nextLevelSuggestions = nextCategory
    ? [...missingDsaForNext, ...missingDomainForNext].slice(0, 10)
    : [];

  const recommendationMessage = nextCategory
    ? `You are currently aligned with the ${predictedCategory} category. Focus next on ${nextLevelSuggestions
        .slice(0, 5)
        .join(', ')} to move toward ${nextCategory}.`
    : 'You are already in the top rank based on the concepts you provided. Keep revising, building projects, and practicing interviews.';

  return {
    targetDomain: selectedDomain,
    predictedCategory,
    nextCategory,
    readinessScore: currentCoverage.combinedScore,
    dsaCoverage: currentCoverage.dsaCoverage.percentage,
    domainCoverage: currentCoverage.domainCoverage.percentage,
    strengths,
    nextLevelSuggestions,
    summary: `AI prediction shows that your current preparation best fits the ${predictedCategory} package band for ${selectedDomain}.`,
    recommendationMessage,
  };
};
