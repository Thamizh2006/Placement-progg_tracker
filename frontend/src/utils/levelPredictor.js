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

const normalizeConcepts = (value = '') =>
  (Array.isArray(value) ? value : String(value).split(/[\n,]/))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const conceptMatches = (knownConcepts, expectedConcepts) =>
  expectedConcepts.filter((concept) =>
    knownConcepts.some(
      (known) => known.includes(concept.toLowerCase()) || concept.toLowerCase().includes(known)
    )
  );

const getCoverage = (knownConcepts, expectedConcepts = []) => {
  const matched = conceptMatches(knownConcepts, expectedConcepts);
  return {
    matched,
    percentage: expectedConcepts.length
      ? Math.round((matched.length / expectedConcepts.length) * 100)
      : 0,
  };
};

export const predictStudentLevel = ({
  dsaConcepts = '',
  domainConcepts = '',
  targetDomain = 'Full Stack Development',
}) => {
  const normalizedDsaConcepts = normalizeConcepts(dsaConcepts);
  const normalizedDomainConcepts = normalizeConcepts(domainConcepts);
  const selectedDomain = domainBuckets[targetDomain] ? targetDomain : 'Full Stack Development';

  const coverageByLevel = salaryOrder.map((level) => {
    const dsaCoverage = getCoverage(normalizedDsaConcepts, dsaBuckets[level]);
    const domainCoverage = getCoverage(normalizedDomainConcepts, domainBuckets[selectedDomain][level]);
    return {
      level,
      dsaCoverage,
      domainCoverage,
      combinedScore: Math.round(dsaCoverage.percentage * 0.55 + domainCoverage.percentage * 0.45),
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

  const nextLevelSuggestions = nextCategory
    ? [
        ...dsaBuckets[nextCategory].filter(
          (concept) => !conceptMatches(normalizedDsaConcepts, [concept]).length
        ),
        ...domainBuckets[selectedDomain][nextCategory].filter(
          (concept) => !conceptMatches(normalizedDomainConcepts, [concept]).length
        ),
      ].slice(0, 10)
    : [];

  return {
    targetDomain: selectedDomain,
    predictedCategory,
    nextCategory,
    readinessScore: currentCoverage.combinedScore,
    dsaCoverage: currentCoverage.dsaCoverage.percentage,
    domainCoverage: currentCoverage.domainCoverage.percentage,
    strengths: [...currentCoverage.dsaCoverage.matched, ...currentCoverage.domainCoverage.matched].slice(0, 8),
    nextLevelSuggestions,
    summary: `AI prediction shows that your current preparation best fits the ${predictedCategory} package band for ${selectedDomain}.`,
    recommendationMessage: nextCategory
      ? `You are currently aligned with the ${predictedCategory} category. Focus next on ${nextLevelSuggestions
          .slice(0, 5)
          .join(', ')} to move toward ${nextCategory}.`
      : 'You are already in the top rank based on the concepts you provided. Keep revising, building projects, and practicing interviews.',
  };
};
