import { ScoringConfig } from './types';

/**
 * Default scoring configuration for all games
 * This configuration can be modified in real-time via the Scoring Controls Modal
 * and will persist in localStorage
 */
export const DEFAULT_CONFIG: ScoringConfig = {
  // 1. Mental Math Sprint
  mentalMath: {
    weights: {
      accuracy: 0.35,
      speed: 0.25,
      quantitativeAptitude: 0.25,
      mentalStamina: 0.15,
    },
    accuracy: {
      mode: 'graded', // 'binary' or 'graded'
    },
    quantitativeAptitude: {
      wAccuracy: 0.6,
      wSpeed: 0.4,
    },
    mentalStamina: {
      wSpeed: 0.5,
      opsMultiplier: 50,
    },
  },

  // 2. Stroop Test
  stroopTest: {
    weights: {
      cognitiveFlex: 0.3,
      cognitiveAgility: 0.3,
      accuracy: 0.25,
      speed: 0.15,
    },
    speed: {
      timeMultiplier: 100,
    },
    cognitiveAgility: {
      wAccuracy: 0.6,
      wSpeed: 0.4,
    },
  },

  // 3. Sign Sudoku
  signSudoku: {
    weights: {
      accuracy: 0.3,
      reasoning: 0.25,
      attentionToDetail: 0.2,
      speed: 0.15,
      math: 0.1,
    },
    accuracy: {
      incorrectPenalty: 10,
    },
    speed: {
      timeLeftWeight: 50,
      avgTimeWeight: 50,
    },
  },

  // 4. Face-Name Match
  faceNameMatch: {
    weights: {
      memory: 0.5,
      accuracy: 0.3,
      speed: 0.2,
    },
    accuracy: {
      falsePositivePenalty: 15,
    },
    speed: {
      timeMultiplier: 100,
    },
  },

  // 5. Card Flip Challenge
  cardFlip: {
    weights: {
      patternRecognition: 0.35,
      reasoning: 0.3,
      strategy: 0.2,
      speed: 0.15,
    },
    reasoning: {
      wFlips: 0.7,
      wPatternRecognition: 0.3,
    },
  },

  // 6. Scenario Challenge (AI)
  scenarioChallenge: {
    weights: {
      reasoning: 0.25,
      decisionMaking: 0.25,
      empathy: 0.2,
      creativity: 0.15,
      communication: 0.15,
    },
    aiPrompt: `Evaluate the user's response to this scenario on a scale of 0-100 for each competency:
- Reasoning: Logical thinking and problem-solving ability
- Decision Making: Quality of choices and considerations
- Empathy: Understanding of emotional and social factors
- Creativity: Novel and innovative approaches
- Communication: Clarity and effectiveness of expression

Return scores as JSON: { reasoning: X, decisionMaking: X, empathy: X, creativity: X, communication: X }`,
  },

  // 7. Debate Mode (AI)
  debateMode: {
    weights: {
      reasoning: 0.3,
      holisticAnalysis: 0.3,
      cognitiveAgility: 0.25,
      communication: 0.15,
    },
    aiPrompt: `Evaluate the user's debate performance on a scale of 0-100 for each competency:
- Reasoning: Logic, evidence, and argumentation quality
- Holistic Analysis: Ability to see multiple perspectives and implications
- Cognitive Agility: Adapting to counterarguments and thinking on feet
- Communication: Clarity, persuasiveness, and articulation

Return scores as JSON: { reasoning: X, holisticAnalysis: X, cognitiveAgility: X, communication: X }`,
  },

  // 8. Creative Uses (AI)
  creativeUses: {
    weights: {
      creativity: 0.7,
      speed: 0.3,
    },
    creativity: {
      wOriginality: 0.6,
      wDiversity: 0.4,
    },
    speed: {
      multiplier: 10,
    },
    aiPrompt: `Evaluate the user's creative uses on a scale of 0-100:
- Originality: How unique and novel are the uses?
- Diversity: How varied are the categories of uses?
- Valid Uses: Count of uses that are actually valid and practical

Return scores as JSON: { originality: X, diversity: X, validUses: X }`,
  },
};
