// Core type definitions for the Scoring Testbed

export interface CompetencyScore {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface GameResult {
  gameId: string;
  gameName: string;
  difficulty?: string;
  timestamp: Date;
  finalScore: number;
  competencies: CompetencyScore[];
  rawData: Record<string, any>;
}

// Mental Math Sprint
export interface MentalMathConfig {
  weights: {
    accuracy: number;
    speed: number;
    quantitativeAptitude: number;
    mentalStamina: number;
  };
  accuracy: {
    mode: 'binary' | 'graded';
  };
  quantitativeAptitude: {
    wAccuracy: number;
    wSpeed: number;
  };
  mentalStamina: {
    wSpeed: number;
    opsMultiplier: number;
  };
}

// Stroop Test
export interface StroopTestConfig {
  weights: {
    cognitiveFlex: number;
    cognitiveAgility: number;
    accuracy: number;
    speed: number;
  };
  speed: {
    timeMultiplier: number;
  };
  cognitiveAgility: {
    wAccuracy: number;
    wSpeed: number;
  };
}

// Sign Sudoku
export interface SignSudokuConfig {
  weights: {
    accuracy: number;
    reasoning: number;
    attentionToDetail: number;
    speed: number;
    math: number;
  };
  accuracy: {
    incorrectPenalty: number;
  };
  speed: {
    timeLeftWeight: number;
    avgTimeWeight: number;
  };
}

// Face-Name Match
export interface FaceNameMatchConfig {
  weights: {
    memory: number;
    accuracy: number;
    speed: number;
  };
  accuracy: {
    falsePositivePenalty: number;
  };
  speed: {
    timeMultiplier: number;
  };
}

// Card Flip Challenge
export interface CardFlipConfig {
  weights: {
    patternRecognition: number;
    reasoning: number;
    strategy: number;
    speed: number;
  };
  reasoning: {
    wFlips: number;
    wPatternRecognition: number;
  };
}

// Scenario Challenge (AI)
export interface ScenarioChallengeConfig {
  weights: {
    reasoning: number;
    decisionMaking: number;
    empathy: number;
    creativity: number;
    communication: number;
  };
  aiPrompt: string;
}

// Debate Mode (AI)
export interface DebateModeConfig {
  weights: {
    reasoning: number;
    holisticAnalysis: number;
    cognitiveAgility: number;
    communication: number;
  };
  aiPrompt: string;
}

// Creative Uses (AI)
export interface CreativeUsesConfig {
  weights: {
    creativity: number;
    speed: number;
  };
  creativity: {
    wOriginality: number;
    wDiversity: number;
  };
  speed: {
    multiplier: number;
  };
  aiPrompt: string;
}

// Global configuration interface
export interface ScoringConfig {
  mentalMath: MentalMathConfig;
  stroopTest: StroopTestConfig;
  signSudoku: SignSudokuConfig;
  faceNameMatch: FaceNameMatchConfig;
  cardFlip: CardFlipConfig;
  scenarioChallenge: ScenarioChallengeConfig;
  debateMode: DebateModeConfig;
  creativeUses: CreativeUsesConfig;
}
