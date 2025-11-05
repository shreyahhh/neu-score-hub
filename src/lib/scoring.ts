import { ScoringConfig, GameResult, CompetencyScore } from './types';

/**
 * Utility function to create a competency score object
 */
function createCompetency(
  name: string,
  score: number,
  weight: number
): CompetencyScore {
  return {
    name,
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    weight,
    weightedScore: Math.max(0, Math.min(100, score)) * weight,
  };
}

/**
 * Calculate Mental Math Sprint score
 */
export function calculateMentalMathScore(
  config: ScoringConfig['mentalMath'],
  data: {
    correct: number;
    total: number;
    percentError: number;
    timeTaken: number;
    maxTime: number;
    numOperations: number;
  }
): GameResult {
  const { weights, accuracy: accConfig, quantitativeAptitude, mentalStamina } = config;

  // Accuracy calculation
  let accuracyScore: number;
  if (accConfig.mode === 'binary') {
    accuracyScore = data.correct === data.total ? 100 : 0;
  } else {
    accuracyScore = 100 - data.percentError;
  }

  // Speed calculation (inverse of time taken)
  const speedScore = 100 - ((data.timeTaken / data.maxTime) * 100);

  // Quantitative Aptitude
  const quantScore =
    accuracyScore * quantitativeAptitude.wAccuracy +
    speedScore * quantitativeAptitude.wSpeed;

  // Mental Stamina
  const opsPerSecond = data.numOperations / data.timeTaken;
  const staminaScore =
    speedScore * mentalStamina.wSpeed +
    opsPerSecond * mentalStamina.opsMultiplier;

  // Create competencies
  const competencies: CompetencyScore[] = [
    createCompetency('Accuracy', accuracyScore, weights.accuracy),
    createCompetency('Speed', speedScore, weights.speed),
    createCompetency('Quantitative Aptitude', quantScore, weights.quantitativeAptitude),
    createCompetency('Mental Stamina', staminaScore, weights.mentalStamina),
  ];

  // Calculate final score
  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'mental-math',
    gameName: 'Mental Math Sprint',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}

/**
 * Calculate Stroop Test score
 */
export function calculateStroopScore(
  config: ScoringConfig['stroopTest'],
  data: {
    correct: number;
    total: number;
    avgTime: number;
    maxTime: number;
    cognitiveFlexScore: number; // Pre-calculated or from game logic
  }
): GameResult {
  const { weights, speed: speedConfig, cognitiveAgility } = config;

  // Accuracy
  const accuracyScore = (data.correct / data.total) * 100;

  // Speed
  const speedScore = 100 - ((data.avgTime / data.maxTime) * speedConfig.timeMultiplier);

  // Cognitive Agility
  const agilityScore =
    accuracyScore * cognitiveAgility.wAccuracy +
    speedScore * cognitiveAgility.wSpeed;

  const competencies: CompetencyScore[] = [
    createCompetency('Cognitive Flexibility', data.cognitiveFlexScore, weights.cognitiveFlex),
    createCompetency('Cognitive Agility', agilityScore, weights.cognitiveAgility),
    createCompetency('Accuracy', accuracyScore, weights.accuracy),
    createCompetency('Speed', speedScore, weights.speed),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'stroop-test',
    gameName: 'Stroop Test',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}

/**
 * Calculate Sign Sudoku score
 */
export function calculateSignSudokuScore(
  config: ScoringConfig['signSudoku'],
  data: {
    correct: number;
    incorrect: number;
    emptyCells: number;
    timeLeft: number;
    totalTime: number;
    avgTimePerCorrect: number;
    reasoningScore: number;
    attentionScore: number;
    mathScore: number;
  }
): GameResult {
  const { weights, accuracy: accConfig, speed: speedConfig } = config;

  // Accuracy
  const accuracyScore =
    ((data.correct / data.emptyCells) * 100) -
    (data.incorrect * accConfig.incorrectPenalty);

  // Speed
  const speedScore =
    (data.timeLeft / data.totalTime) * speedConfig.timeLeftWeight +
    speedConfig.avgTimeWeight / (data.avgTimePerCorrect + 1);

  const competencies: CompetencyScore[] = [
    createCompetency('Accuracy', accuracyScore, weights.accuracy),
    createCompetency('Reasoning', data.reasoningScore, weights.reasoning),
    createCompetency('Attention to Detail', data.attentionScore, weights.attentionToDetail),
    createCompetency('Speed', speedScore, weights.speed),
    createCompetency('Math', data.mathScore, weights.math),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'sign-sudoku',
    gameName: 'Sign Sudoku',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}

/**
 * Calculate Face-Name Match score
 */
export function calculateFaceNameScore(
  config: ScoringConfig['faceNameMatch'],
  data: {
    correct: number;
    correctNew: number;
    falsePositives: number;
    totalAttempts: number;
    avgTime: number;
    maxTime: number;
    memoryScore: number;
  }
): GameResult {
  const { weights, accuracy: accConfig, speed: speedConfig } = config;

  // Accuracy
  const accuracyScore =
    ((data.correct + data.correctNew) / data.totalAttempts) * 100 -
    data.falsePositives * accConfig.falsePositivePenalty;

  // Speed
  const speedScore = 100 - ((data.avgTime / data.maxTime) * speedConfig.timeMultiplier);

  const competencies: CompetencyScore[] = [
    createCompetency('Memory', data.memoryScore, weights.memory),
    createCompetency('Accuracy', accuracyScore, weights.accuracy),
    createCompetency('Speed', speedScore, weights.speed),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'face-name-match',
    gameName: 'Face-Name Match',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}

/**
 * Calculate Card Flip Challenge score
 */
export function calculateCardFlipScore(
  config: ScoringConfig['cardFlip'],
  data: {
    minFlips: number;
    actualFlips: number;
    patternRecScore: number;
    strategyScore: number;
    speedScore: number;
  }
): GameResult {
  const { weights, reasoning } = config;

  // Reasoning
  const reasoningScore =
    ((data.minFlips / data.actualFlips) * 100) * reasoning.wFlips +
    data.patternRecScore * reasoning.wPatternRecognition;

  const competencies: CompetencyScore[] = [
    createCompetency('Pattern Recognition', data.patternRecScore, weights.patternRecognition),
    createCompetency('Reasoning', reasoningScore, weights.reasoning),
    createCompetency('Strategy', data.strategyScore, weights.strategy),
    createCompetency('Speed', data.speedScore, weights.speed),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'card-flip',
    gameName: 'Card Flip Challenge',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}

/**
 * Calculate Scenario Challenge score (AI-based)
 */
export function calculateScenarioChallengeScore(
  config: ScoringConfig['scenarioChallenge'],
  aiScores: {
    reasoning: number;
    decisionMaking: number;
    empathy: number;
    creativity: number;
    communication: number;
  }
): GameResult {
  const { weights } = config;

  const competencies: CompetencyScore[] = [
    createCompetency('Reasoning', aiScores.reasoning, weights.reasoning),
    createCompetency('Decision Making', aiScores.decisionMaking, weights.decisionMaking),
    createCompetency('Empathy', aiScores.empathy, weights.empathy),
    createCompetency('Creativity', aiScores.creativity, weights.creativity),
    createCompetency('Communication', aiScores.communication, weights.communication),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'scenario-challenge',
    gameName: 'Scenario Challenge',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: aiScores,
  };
}

/**
 * Calculate Debate Mode score (AI-based)
 */
export function calculateDebateModeScore(
  config: ScoringConfig['debateMode'],
  aiScores: {
    reasoning: number;
    holisticAnalysis: number;
    cognitiveAgility: number;
    communication: number;
  }
): GameResult {
  const { weights } = config;

  const competencies: CompetencyScore[] = [
    createCompetency('Reasoning', aiScores.reasoning, weights.reasoning),
    createCompetency('Holistic Analysis', aiScores.holisticAnalysis, weights.holisticAnalysis),
    createCompetency('Cognitive Agility', aiScores.cognitiveAgility, weights.cognitiveAgility),
    createCompetency('Communication', aiScores.communication, weights.communication),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'debate-mode',
    gameName: 'Debate Mode',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: aiScores,
  };
}

/**
 * Calculate Creative Uses score (AI-based)
 */
export function calculateCreativeUsesScore(
  config: ScoringConfig['creativeUses'],
  data: {
    originality: number; // from AI
    diversity: number; // from AI
    validUses: number; // from AI
    timeLimit: number;
  }
): GameResult {
  const { weights, creativity, speed } = config;

  // Creativity
  const creativityScore =
    data.originality * creativity.wOriginality +
    data.diversity * creativity.wDiversity;

  // Speed
  const speedScore = (data.validUses / data.timeLimit) * speed.multiplier;

  const competencies: CompetencyScore[] = [
    createCompetency('Creativity', creativityScore, weights.creativity),
    createCompetency('Speed', speedScore, weights.speed),
  ];

  const finalScore = competencies.reduce((sum, c) => sum + c.weightedScore, 0);

  return {
    gameId: 'creative-uses',
    gameName: 'Creative Uses',
    timestamp: new Date(),
    finalScore: Math.max(0, Math.min(100, finalScore)),
    competencies,
    rawData: data,
  };
}
