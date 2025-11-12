import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Play, Home, CheckCircle2 } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame, DEFAULT_USER_ID } from '@/lib/api';
import { GameResult } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

type GameState = 'instructions' | 'stage1' | 'stage1Complete' | 'stage2' | 'stage2Complete' | 'results';

interface CardData {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
  mirrorPosition: number; // Position of its matching pair (mirror position)
}

interface MoveData {
  card1Position: number;
  card2Position: number;
  isCorrectMatch: boolean;
  isPatternMatch: boolean; // True if this match follows the mirroring pattern
  timeSinceStart: number;
  stage: 1 | 2;
}

interface StageData {
  pairsMatched: number;
  totalFlips: number;
  timeTaken: number;
  startTime: number;
  minFlipsPossible: number;
  moves: MoveData[];
  patternMatches: number; // Number of matches that follow the pattern
  randomMatches: number; // Number of matches that don't follow the pattern
  patternDiscoveryMove: number | null; // Move number when pattern was discovered (if ever)
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const STAGE1_CONFIG = {
  rows: 4,
  cols: 5,
  totalCards: 20,
  totalPairs: 10,
  timeLimit: 60, // seconds
  minFlips: 20 // Minimum flips if perfect pattern recognition (10 pairs * 2 flips)
};

const STAGE2_CONFIG = {
  rows: 5,
  cols: 6,
  totalCards: 30,
  totalPairs: 15,
  timeLimit: 90, // seconds
  minFlips: 30 // Minimum flips if perfect pattern recognition (15 pairs * 2 flips)
};

// ============================================================================
// PATTERN ROTATION SYSTEM
// ============================================================================

type PatternType = 'mirror' | 'sequential' | 'horizontalMirror' | 'verticalMirror';

const MASTER_PATTERN_QUEUE: PatternType[] = ['mirror', 'sequential', 'horizontalMirror', 'verticalMirror'];
const STORAGE_KEY = 'cardFlipPlayedPatterns';

/**
 * Get the next pattern from the rotation queue
 * Uses localStorage to track which patterns have been played
 * Cycles through all patterns before repeating
 */
const getNextPattern = (): PatternType => {
  try {
    const playedPatternsStr = localStorage.getItem(STORAGE_KEY);
    const playedPatterns: PatternType[] = playedPatternsStr ? JSON.parse(playedPatternsStr) : [];
    
    // Find the next unplayed pattern from the master queue
    for (const pattern of MASTER_PATTERN_QUEUE) {
      if (!playedPatterns.includes(pattern)) {
        // Mark this pattern as played
        const updatedPlayed = [...playedPatterns, pattern];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayed));
        return pattern;
      }
    }
    
    // All patterns have been played, reset and start from beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify([MASTER_PATTERN_QUEUE[0]]));
    return MASTER_PATTERN_QUEUE[0];
  } catch (error) {
    console.error('Error accessing localStorage for pattern rotation:', error);
    // Fallback to first pattern if localStorage fails
    return MASTER_PATTERN_QUEUE[0];
  }
};

// ============================================================================
// PATTERN GENERATION
// ============================================================================

/**
 * Generate card values based on the specified pattern type
 */
const generatePattern = (
  patternType: PatternType,
  totalPairs: number,
  rows: number,
  cols: number
): { values: string[], mirrorMap: Map<number, number>, positionMap: number[] } => {
  const symbols = ['♠', '♥', '♦', '♣', '★', '☆', '●', '○', '■', '□', '▲', '△', '◆', '◇', '▣', '◐', '◑', '◒', '◓', '◔'];
  const totalCards = totalPairs * 2;
  const mirrorMap = new Map<number, number>();
  const values: string[] = new Array(totalCards).fill('');
  
  // Create pairs of symbols (shuffled to hide pattern)
  const symbolPairs: string[] = [];
  for (let i = 0; i < totalPairs; i++) {
    const symbol = symbols[i % symbols.length];
    symbolPairs.push(symbol);
  }
  
  // Shuffle symbol pairs so pattern isn't obvious from symbols alone
  for (let i = symbolPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbolPairs[i], symbolPairs[j]] = [symbolPairs[j], symbolPairs[i]];
  }
  
  // Generate pairs based on pattern type
  let pairIndex = 0;
  
  switch (patternType) {
    case 'mirror': {
      // Position 0 matches position (N-1), position 1 matches position (N-2), etc.
      for (let i = 0; i < totalPairs; i++) {
        const symbol = symbolPairs[pairIndex++];
        const pos1 = i;
        const pos2 = totalCards - 1 - i;
        values[pos1] = symbol;
        values[pos2] = symbol;
        mirrorMap.set(pos1, pos2);
        mirrorMap.set(pos2, pos1);
      }
      break;
    }
    
    case 'sequential': {
      // Position 0 matches position 1, position 2 matches position 3, etc.
      for (let i = 0; i < totalPairs; i++) {
        const symbol = symbolPairs[pairIndex++];
        const pos1 = i * 2;
        const pos2 = i * 2 + 1;
        values[pos1] = symbol;
        values[pos2] = symbol;
        mirrorMap.set(pos1, pos2);
        mirrorMap.set(pos2, pos1);
      }
      break;
    }
    
    case 'horizontalMirror': {
      // Cards in the same row mirror horizontally
      // Column 0 matches column (COLS-1), column 1 matches column (COLS-2), etc.
      const hasMiddleCol = cols % 2 === 1;
      const middleCol = Math.floor(cols / 2);
      const middleColPairs: number[] = [];
      
      for (let row = 0; row < rows; row++) {
        const pairsInRow = Math.floor(cols / 2);
        for (let pair = 0; pair < pairsInRow; pair++) {
          const symbol = symbolPairs[pairIndex++];
          const col1 = pair;
          const col2 = cols - 1 - pair;
          const pos1 = row * cols + col1;
          const pos2 = row * cols + col2;
          values[pos1] = symbol;
          values[pos2] = symbol;
          mirrorMap.set(pos1, pos2);
          mirrorMap.set(pos2, pos1);
        }
        
        // Collect middle column positions for pairing across rows
        if (hasMiddleCol) {
          middleColPairs.push(row * cols + middleCol);
        }
      }
      
      // Pair middle column positions across rows (maintaining horizontal mirror concept)
      if (hasMiddleCol && middleColPairs.length > 0) {
        for (let i = 0; i < middleColPairs.length; i += 2) {
          if (i + 1 < middleColPairs.length && pairIndex < totalPairs) {
            const symbol = symbolPairs[pairIndex++];
            const pos1 = middleColPairs[i];
            const pos2 = middleColPairs[i + 1];
            values[pos1] = symbol;
            values[pos2] = symbol;
            mirrorMap.set(pos1, pos2);
            mirrorMap.set(pos2, pos1);
          }
        }
      }
      break;
    }
    
    case 'verticalMirror': {
      // Cards in the same column mirror vertically
      // Row 0 matches row (ROWS-1), row 1 matches row (ROWS-2), etc.
      const hasMiddleRow = rows % 2 === 1;
      const middleRow = Math.floor(rows / 2);
      const middleRowPairs: number[] = [];
      
      for (let col = 0; col < cols; col++) {
        const pairsInCol = Math.floor(rows / 2);
        for (let pair = 0; pair < pairsInCol; pair++) {
          const symbol = symbolPairs[pairIndex++];
          const row1 = pair;
          const row2 = rows - 1 - pair;
          const pos1 = row1 * cols + col;
          const pos2 = row2 * cols + col;
          values[pos1] = symbol;
          values[pos2] = symbol;
          mirrorMap.set(pos1, pos2);
          mirrorMap.set(pos2, pos1);
        }
        
        // Collect middle row positions for pairing across columns
        if (hasMiddleRow) {
          middleRowPairs.push(middleRow * cols + col);
        }
      }
      
      // Pair middle row positions across columns (maintaining vertical mirror concept)
      if (hasMiddleRow && middleRowPairs.length > 0) {
        for (let i = 0; i < middleRowPairs.length; i += 2) {
          if (i + 1 < middleRowPairs.length && pairIndex < totalPairs) {
            const symbol = symbolPairs[pairIndex++];
            const pos1 = middleRowPairs[i];
            const pos2 = middleRowPairs[i + 1];
            values[pos1] = symbol;
            values[pos2] = symbol;
            mirrorMap.set(pos1, pos2);
            mirrorMap.set(pos2, pos1);
          }
        }
      }
      break;
    }
  }
  
  // Validate that we generated the correct number of pairs
  if (pairIndex !== totalPairs) {
    console.warn(
      `Pattern ${patternType} generated ${pairIndex} pairs but expected ${totalPairs}. ` +
      `Grid: ${rows}×${cols} (${totalCards} cards). ` +
      `This may indicate a pattern limitation with this grid size.`
    );
  }
  
  // positionMap is identity map since we're using grid positions directly
  const positionMap = Array.from({ length: totalCards }, (_, i) => i);
  
  return { values, mirrorMap, positionMap };
};

// ============================================================================
// PATTERN CHECKERS
// ============================================================================

/**
 * Check if two positions follow the specified pattern
 */
const checkPattern = (
  patternType: PatternType,
  pos1: number,
  pos2: number,
  totalCards: number,
  rows: number,
  cols: number
): boolean => {
  switch (patternType) {
    case 'mirror': {
      // pos1 + pos2 === totalCards - 1
      return pos1 + pos2 === totalCards - 1;
    }
    
    case 'sequential': {
      // Math.abs(pos1 - pos2) === 1 && Math.min(pos1, pos2) % 2 === 0
      return Math.abs(pos1 - pos2) === 1 && Math.min(pos1, pos2) % 2 === 0;
    }
    
    case 'horizontalMirror': {
      // Same row, columns mirror: col1 + col2 === COLS - 1
      const row1 = Math.floor(pos1 / cols);
      const row2 = Math.floor(pos2 / cols);
      const col1 = pos1 % cols;
      const col2 = pos2 % cols;
      return row1 === row2 && col1 + col2 === cols - 1;
    }
    
    case 'verticalMirror': {
      // Same column, rows mirror: row1 + row2 === ROWS - 1
      const row1 = Math.floor(pos1 / cols);
      const row2 = Math.floor(pos2 / cols);
      const col1 = pos1 % cols;
      const col2 = pos2 % cols;
      return col1 === col2 && row1 + row2 === rows - 1;
    }
    
    default:
      return false;
  }
};

// ============================================================================
// PATTERN RECOGNITION DETECTION
// ============================================================================

/**
 * Analyze moves to detect if user discovered the pattern
 * Returns pattern recognition score and metrics
 */
const analyzePatternRecognition = (
  moves: MoveData[],
  totalPairs: number,
  totalCards: number,
  positionMap: number[],
  patternType: PatternType,
  rows: number,
  cols: number
) => {
  if (moves.length === 0) {
    return {
      patternDiscovered: false,
      patternRecognitionScore: 0,
      patternMatchRate: 0,
      discoveryMove: null,
      confidence: 0
    };
  }

  // Count pattern matches vs random matches
  // Re-evaluate moves with the correct pattern checker
  const evaluatedMoves = moves.map(m => ({
    ...m,
    isPatternMatch: m.isCorrectMatch && checkPattern(
      patternType,
      m.card1Position,
      m.card2Position,
      totalCards,
      rows,
      cols
    )
  }));
  
  const patternMatches = evaluatedMoves.filter(m => m.isPatternMatch && m.isCorrectMatch).length;
  const randomMatches = evaluatedMoves.filter(m => !m.isPatternMatch && m.isCorrectMatch).length;
  const totalCorrectMatches = patternMatches + randomMatches;
  
  // Calculate pattern match rate (percentage of correct matches that followed pattern)
  const patternMatchRate = totalCorrectMatches > 0 
    ? (patternMatches / totalCorrectMatches) * 100 
    : 0;

  // Detect when pattern was discovered
  // Look for a point where pattern matches become consistent
  let discoveryMove: number | null = null;
  const windowSize = Math.min(5, Math.floor(moves.length / 2));
  
  if (evaluatedMoves.length >= windowSize) {
    for (let i = windowSize; i < evaluatedMoves.length; i++) {
      const recentMoves = evaluatedMoves.slice(i - windowSize, i);
      const recentPatternMatches = recentMoves.filter(m => m.isPatternMatch && m.isCorrectMatch).length;
      const recentCorrectMatches = recentMoves.filter(m => m.isCorrectMatch).length;
      
      // If 80%+ of recent correct matches follow the pattern, pattern was likely discovered
      if (recentCorrectMatches >= 2 && (recentPatternMatches / recentCorrectMatches) >= 0.8) {
        discoveryMove = i - windowSize + 1;
        break;
      }
    }
  }

  // Pattern recognition score (0-100)
  // Based on: pattern match rate, consistency, and early discovery
  let patternRecognitionScore = 0;
  
  if (totalCorrectMatches > 0) {
    // Base score from pattern match rate
    patternRecognitionScore = patternMatchRate;
    
    // Bonus for early discovery (if discovered in first half of moves)
    if (discoveryMove !== null && discoveryMove <= moves.length / 2) {
      const earlyBonus = (1 - (discoveryMove / moves.length)) * 20;
      patternRecognitionScore = Math.min(100, patternRecognitionScore + earlyBonus);
    }
    
    // If user got perfect accuracy but didn't follow pattern, give partial credit
    // This rewards good memory/strategy even without pattern recognition
    if (randomMatches > patternMatches * 2 && patternMatchRate < 30) {
      // Instead of heavy penalty, give base score of 30-40 for perfect accuracy
      // This ensures perfect performance still gets decent score
      patternRecognitionScore = Math.max(30, patternMatchRate * 0.6);
    } else if (randomMatches > patternMatches) {
      // Moderate penalty for mostly random but not as severe
      patternRecognitionScore *= 0.7;
    }
  }

  // Confidence level (0-1)
  // Higher confidence if pattern matches are consistent and discovery was early
  let confidence = 0;
  if (patternMatchRate >= 70) {
    confidence = 0.8 + (patternMatchRate - 70) / 300; // 0.8 to 1.0
  } else if (patternMatchRate >= 50) {
    confidence = 0.5 + (patternMatchRate - 50) / 100; // 0.5 to 0.8
  } else {
    confidence = patternMatchRate / 100; // 0 to 0.5
  }

  const patternDiscovered = patternRecognitionScore >= 60 && patternMatchRate >= 50;

  return {
    patternDiscovered,
    patternRecognitionScore: Math.round(patternRecognitionScore),
    patternMatchRate: Math.round(patternMatchRate * 10) / 10,
    discoveryMove,
    confidence: Math.round(confidence * 100) / 100,
    patternMatches,
    randomMatches,
    totalCorrectMatches
  };
};

// ============================================================================
// SCORING LOGIC
// ============================================================================

/**
 * Calculate scores for card flip game
 * Evaluates: Pattern Recognition, Accuracy, Speed, Strategy
 */
const calculateScores = (
  stage1Data: StageData,
  stage2Data: StageData,
  stage1Cards: CardData[],
  stage2Cards: CardData[],
  stage1PositionMap: number[],
  stage2PositionMap: number[],
  patternType: PatternType
) => {
  // Analyze pattern recognition for each stage
  const stage1Analysis = analyzePatternRecognition(
    stage1Data.moves,
    STAGE1_CONFIG.totalPairs,
    STAGE1_CONFIG.totalCards,
    stage1PositionMap,
    patternType,
    STAGE1_CONFIG.rows,
    STAGE1_CONFIG.cols
  );
  const stage2Analysis = analyzePatternRecognition(
    stage2Data.moves,
    STAGE2_CONFIG.totalPairs,
    STAGE2_CONFIG.totalCards,
    stage2PositionMap,
    patternType,
    STAGE2_CONFIG.rows,
    STAGE2_CONFIG.cols
  );
  
  // Weighted average (stage 2 is more important as it's harder)
  const overallPatternRecognition = (stage1Analysis.patternRecognitionScore * 0.4 + stage2Analysis.patternRecognitionScore * 0.6);
  const overallPatternDiscovered = stage1Analysis.patternDiscovered || stage2Analysis.patternDiscovered;
  
  // Accuracy: Percentage of correct matches
  const stage1Accuracy = STAGE1_CONFIG.totalPairs > 0 
    ? (stage1Data.pairsMatched / STAGE1_CONFIG.totalPairs) * 100 
    : 0;
  const stage2Accuracy = STAGE2_CONFIG.totalPairs > 0
    ? (stage2Data.pairsMatched / STAGE2_CONFIG.totalPairs) * 100 
    : 0;
  const overallAccuracy = (stage1Accuracy * 0.4 + stage2Accuracy * 0.6);
  
  // Speed: Based on time taken vs time limit
  // Reward fast completion more generously
  const stage1Speed = STAGE1_CONFIG.timeLimit > 0
    ? Math.min(100, Math.max(0, (1 - (stage1Data.timeTaken / STAGE1_CONFIG.timeLimit)) * 100) * 1.2)
    : 0;
  const stage2Speed = STAGE2_CONFIG.timeLimit > 0
    ? Math.min(100, Math.max(0, (1 - (stage2Data.timeTaken / STAGE2_CONFIG.timeLimit)) * 100) * 1.2)
    : 0;
  
  // Bonus for completing well under time limit
  const stage1TimeBonus = stage1Data.timeTaken < STAGE1_CONFIG.timeLimit * 0.5 ? 10 : 0;
  const stage2TimeBonus = stage2Data.timeTaken < STAGE2_CONFIG.timeLimit * 0.5 ? 10 : 0;
  
  const overallSpeed = Math.min(100, (stage1Speed * 0.4 + stage2Speed * 0.6) + (stage1TimeBonus * 0.4 + stage2TimeBonus * 0.6));
  
  // Strategy/Efficiency: Based on flips vs minimum possible
  // Lower flips relative to minimum = better strategy
  // More forgiving - reward efficiency but don't penalize too harshly
  const stage1Efficiency = stage1Data.totalFlips > 0
    ? Math.min(100, (STAGE1_CONFIG.minFlips / stage1Data.totalFlips) * 100)
    : 0;
  const stage2Efficiency = stage2Data.totalFlips > 0
    ? Math.min(100, (STAGE2_CONFIG.minFlips / stage2Data.totalFlips) * 100)
    : 0;
  
  // If user got perfect accuracy, give efficiency bonus even if flips were higher
  const stage1PerfectBonus = stage1Data.pairsMatched === STAGE1_CONFIG.totalPairs && stage1Efficiency < 80 ? 15 : 0;
  const stage2PerfectBonus = stage2Data.pairsMatched === STAGE2_CONFIG.totalPairs && stage2Efficiency < 80 ? 15 : 0;
  
  const overallEfficiency = Math.min(100, (stage1Efficiency * 0.4 + stage2Efficiency * 0.6) + (stage1PerfectBonus * 0.4 + stage2PerfectBonus * 0.6));
  
  // Calculate weighted final score
  // Adjusted weights to be more balanced and reward perfect performance
  // Pattern Recognition: 30% (important but not overly penalizing)
  // Accuracy: 35% (most important - did they complete the task?)
  // Speed: 20%
  // Strategy/Efficiency: 15%
  
  // Bonus for perfect completion
  const perfectCompletion = 
    stage1Data.pairsMatched === STAGE1_CONFIG.totalPairs && 
    stage2Data.pairsMatched === STAGE2_CONFIG.totalPairs;
  const perfectBonus = perfectCompletion ? 10 : 0;
  
  const finalScore = Math.min(100,
    overallPatternRecognition * 0.30 +
    overallAccuracy * 0.35 +
    overallSpeed * 0.20 +
    overallEfficiency * 0.15 +
    perfectBonus
  );
  
  return {
    final_score: Math.round(finalScore * 100) / 100,
    competencies: {
      pattern_recognition: {
        raw: Math.round(overallPatternRecognition * 100) / 100,
        weight: 0.30,
        weighted: Math.round(overallPatternRecognition * 0.30 * 100) / 100
      },
      accuracy: {
        raw: Math.round(overallAccuracy * 100) / 100,
        weight: 0.35,
        weighted: Math.round(overallAccuracy * 0.35 * 100) / 100
      },
      speed: {
        raw: Math.round(overallSpeed * 100) / 100,
        weight: 0.20,
        weighted: Math.round(overallSpeed * 0.20 * 100) / 100
      },
      strategy: {
        raw: Math.round(overallEfficiency * 100) / 100,
        weight: 0.15,
        weighted: Math.round(overallEfficiency * 0.15 * 100) / 100
      }
    },
    raw_stats: {
      stage1: {
        pairs_matched: stage1Data.pairsMatched,
        total_pairs: STAGE1_CONFIG.totalPairs,
        total_flips: stage1Data.totalFlips,
        min_flips_possible: STAGE1_CONFIG.minFlips,
        time_taken: stage1Data.timeTaken,
        time_limit: STAGE1_CONFIG.timeLimit,
        pattern_matches: stage1Analysis.patternMatches,
        random_matches: stage1Analysis.randomMatches,
        pattern_recognition_score: stage1Analysis.patternRecognitionScore,
        pattern_discovered: stage1Analysis.patternDiscovered,
        discovery_move: stage1Analysis.discoveryMove
      },
      stage2: {
        pairs_matched: stage2Data.pairsMatched,
        total_pairs: STAGE2_CONFIG.totalPairs,
        total_flips: stage2Data.totalFlips,
        min_flips_possible: STAGE2_CONFIG.minFlips,
        time_taken: stage2Data.timeTaken,
        time_limit: STAGE2_CONFIG.timeLimit,
        pattern_matches: stage2Analysis.patternMatches,
        random_matches: stage2Analysis.randomMatches,
        pattern_recognition_score: stage2Analysis.patternRecognitionScore,
        pattern_discovered: stage2Analysis.patternDiscovered,
        discovery_move: stage2Analysis.discoveryMove
      },
      overall: {
        total_pairs_matched: stage1Data.pairsMatched + stage2Data.pairsMatched,
        total_pairs_possible: STAGE1_CONFIG.totalPairs + STAGE2_CONFIG.totalPairs,
        total_flips: stage1Data.totalFlips + stage2Data.totalFlips,
        total_min_flips: STAGE1_CONFIG.minFlips + STAGE2_CONFIG.minFlips,
        total_time_taken: stage1Data.timeTaken + stage2Data.timeTaken,
        total_time_limit: STAGE1_CONFIG.timeLimit + STAGE2_CONFIG.timeLimit,
        pattern_discovered: overallPatternDiscovered,
        pattern_recognition_score: Math.round(overallPatternRecognition * 100) / 100
      }
    }
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CardFlipEasy = () => {
  const navigate = useNavigate();
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [stage1Data, setStage1Data] = useState<StageData>({
    pairsMatched: 0,
    totalFlips: 0,
    timeTaken: 0,
    startTime: 0,
    minFlipsPossible: STAGE1_CONFIG.minFlips,
    moves: [],
    patternMatches: 0,
    randomMatches: 0,
    patternDiscoveryMove: null
  });
  const [stage2Data, setStage2Data] = useState<StageData>({
    pairsMatched: 0,
    totalFlips: 0,
    timeTaken: 0,
    startTime: 0,
    minFlipsPossible: STAGE2_CONFIG.minFlips,
    moves: [],
    patternMatches: 0,
    randomMatches: 0,
    patternDiscoveryMove: null
  });
  
  // Stage 1 Cards
  const [stage1Cards, setStage1Cards] = useState<CardData[]>([]);
  const [stage1FlippedCards, setStage1FlippedCards] = useState<number[]>([]);
  const [stage1IsProcessing, setStage1IsProcessing] = useState(false);
  const [stage1TimerRunning, setStage1TimerRunning] = useState(false);
  const [stage1MirrorMap, setStage1MirrorMap] = useState<Map<number, number>>(new Map());
  const [stage1PositionMap, setStage1PositionMap] = useState<number[]>([]);
  
  // Stage 2 Cards
  const [stage2Cards, setStage2Cards] = useState<CardData[]>([]);
  const [stage2FlippedCards, setStage2FlippedCards] = useState<number[]>([]);
  const [stage2IsProcessing, setStage2IsProcessing] = useState(false);
  const [stage2TimerRunning, setStage2TimerRunning] = useState(false);
  const [stage2MirrorMap, setStage2MirrorMap] = useState<Map<number, number>>(new Map());
  const [stage2PositionMap, setStage2PositionMap] = useState<number[]>([]);
  
  // Store the selected pattern for the session (used for both stages)
  const [sessionPatternType, setSessionPatternType] = useState<PatternType | null>(null);
  
  const [result, setResult] = useState<GameResult | null>(null);

  // ============================================================================
  // INITIALIZE STAGE 1
  // ============================================================================

  const initializeStage1 = useCallback((patternType: PatternType) => {
    const { values, mirrorMap, positionMap } = generatePattern(
      patternType,
      STAGE1_CONFIG.totalPairs,
      STAGE1_CONFIG.rows,
      STAGE1_CONFIG.cols
    );
    const cards: CardData[] = values.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
      position: index, // Visual position in grid
      mirrorPosition: mirrorMap.get(index) || -1
    }));
    
    setStage1Cards(cards);
    setStage1FlippedCards([]);
    setStage1IsProcessing(false);
    setStage1MirrorMap(mirrorMap);
    setStage1PositionMap(positionMap);
    setStage1Data({
      pairsMatched: 0,
      totalFlips: 0,
      timeTaken: 0,
      startTime: Date.now(),
      minFlipsPossible: STAGE1_CONFIG.minFlips,
      moves: [],
      patternMatches: 0,
      randomMatches: 0,
      patternDiscoveryMove: null
    });
    setStage1TimerRunning(true);
  }, []);

  // ============================================================================
  // INITIALIZE STAGE 2
  // ============================================================================

  const initializeStage2 = useCallback((patternType: PatternType) => {
    const { values, mirrorMap, positionMap } = generatePattern(
      patternType,
      STAGE2_CONFIG.totalPairs,
      STAGE2_CONFIG.rows,
      STAGE2_CONFIG.cols
    );
    const cards: CardData[] = values.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
      position: index, // Visual position in grid
      mirrorPosition: mirrorMap.get(index) || -1
    }));
    
    setStage2Cards(cards);
    setStage2FlippedCards([]);
    setStage2IsProcessing(false);
    setStage2MirrorMap(mirrorMap);
    setStage2PositionMap(positionMap);
    setStage2Data({
      pairsMatched: 0,
      totalFlips: 0,
      timeTaken: 0,
      startTime: Date.now(),
      minFlipsPossible: STAGE2_CONFIG.minFlips,
      moves: [],
      patternMatches: 0,
      randomMatches: 0,
      patternDiscoveryMove: null
    });
    setStage2TimerRunning(true);
  }, []);

  // ============================================================================
  // HANDLE CARD CLICK - STAGE 1
  // ============================================================================

  const handleStage1CardClick = (cardId: number) => {
    if (stage1IsProcessing || !stage1TimerRunning) return;
    
    const card = stage1Cards[cardId];
    if (card.isFlipped || card.isMatched) return;
    
    if (stage1FlippedCards.length >= 2) return;
    
    // Flip the card
    const newCards = [...stage1Cards];
    newCards[cardId].isFlipped = true;
    setStage1Cards(newCards);
    
    const newFlipped = [...stage1FlippedCards, cardId];
    setStage1FlippedCards(newFlipped);
    
    // Update flip count
    setStage1Data(prev => ({ ...prev, totalFlips: prev.totalFlips + 1 }));
    
    // Check if two cards are flipped
    if (newFlipped.length === 2) {
      setStage1IsProcessing(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];
      
      const isCorrectMatch = firstCard.value === secondCard.value;
      const isPatternMatch = sessionPatternType 
        ? checkPattern(
            sessionPatternType,
            firstId,
            secondId,
            STAGE1_CONFIG.totalCards,
            STAGE1_CONFIG.rows,
            STAGE1_CONFIG.cols
          )
        : false;
      
      // Record move with current timestamp
      const currentTime = Date.now();
      const move: MoveData = {
        card1Position: firstId,
        card2Position: secondId,
        isCorrectMatch,
        isPatternMatch,
        timeSinceStart: (currentTime - stage1Data.startTime) / 1000,
        stage: 1
      };
      
      // Calculate new values based on current state
      const currentPairsMatched = stage1Data.pairsMatched;
      const newPairsMatched = isCorrectMatch ? currentPairsMatched + 1 : currentPairsMatched;
      const allPairsMatched = isCorrectMatch && newPairsMatched === STAGE1_CONFIG.totalPairs;
      
      // Update state using functional updates
      setStage1Data(prev => ({
        ...prev,
        moves: [...prev.moves, move],
        patternMatches: isPatternMatch && isCorrectMatch ? prev.patternMatches + 1 : prev.patternMatches,
        randomMatches: !isPatternMatch && isCorrectMatch ? prev.randomMatches + 1 : prev.randomMatches,
        pairsMatched: newPairsMatched,
        timeTaken: allPairsMatched ? (currentTime - prev.startTime) / 1000 : prev.timeTaken
      }));
      
      if (isCorrectMatch) {
        // Match found!
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
        setStage1Cards(newCards);
        setStage1FlippedCards([]);
        setStage1IsProcessing(false);
        
        // Check if all pairs matched - handle after state update
        if (allPairsMatched) {
          setStage1TimerRunning(false);
          setTimeout(() => setGameState('stage1Complete'), 500);
        }
      } else {
        // No match - flip back after 1 second
        setTimeout(() => {
          newCards[firstId].isFlipped = false;
          newCards[secondId].isFlipped = false;
          setStage1Cards(newCards);
          setStage1FlippedCards([]);
          setStage1IsProcessing(false);
        }, 1000);
      }
    }
  };

  // ============================================================================
  // HANDLE CARD CLICK - STAGE 2
  // ============================================================================

  const handleStage2CardClick = (cardId: number) => {
    if (stage2IsProcessing || !stage2TimerRunning) return;
    
    const card = stage2Cards[cardId];
    if (card.isFlipped || card.isMatched) return;
    
    if (stage2FlippedCards.length >= 2) return;
    
    // Flip the card
    const newCards = [...stage2Cards];
    newCards[cardId].isFlipped = true;
    setStage2Cards(newCards);
    
    const newFlipped = [...stage2FlippedCards, cardId];
    setStage2FlippedCards(newFlipped);
    
    // Update flip count
    setStage2Data(prev => ({ ...prev, totalFlips: prev.totalFlips + 1 }));
    
    // Check if two cards are flipped
    if (newFlipped.length === 2) {
      setStage2IsProcessing(true);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];
      
      const isCorrectMatch = firstCard.value === secondCard.value;
      const isPatternMatch = sessionPatternType
        ? checkPattern(
            sessionPatternType,
            firstId,
            secondId,
            STAGE2_CONFIG.totalCards,
            STAGE2_CONFIG.rows,
            STAGE2_CONFIG.cols
          )
        : false;
      
      // Record move with current timestamp
      const currentTime = Date.now();
      const move: MoveData = {
        card1Position: firstId,
        card2Position: secondId,
        isCorrectMatch,
        isPatternMatch,
        timeSinceStart: (currentTime - stage2Data.startTime) / 1000,
        stage: 2
      };
      
      // Calculate new values based on current state
      const currentPairsMatched = stage2Data.pairsMatched;
      const newPairsMatched = isCorrectMatch ? currentPairsMatched + 1 : currentPairsMatched;
      const allPairsMatched = isCorrectMatch && newPairsMatched === STAGE2_CONFIG.totalPairs;
      
      // Update state using functional updates
      setStage2Data(prev => ({
        ...prev,
        moves: [...prev.moves, move],
        patternMatches: isPatternMatch && isCorrectMatch ? prev.patternMatches + 1 : prev.patternMatches,
        randomMatches: !isPatternMatch && isCorrectMatch ? prev.randomMatches + 1 : prev.randomMatches,
        pairsMatched: newPairsMatched,
        timeTaken: allPairsMatched ? (currentTime - prev.startTime) / 1000 : prev.timeTaken
      }));
      
      if (isCorrectMatch) {
        // Match found!
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
        setStage2Cards(newCards);
        setStage2FlippedCards([]);
        setStage2IsProcessing(false);
        
        // Check if all pairs matched - handle after state update
        if (allPairsMatched) {
          setStage2TimerRunning(false);
          setTimeout(() => finishGame(), 500);
        }
      } else {
        // No match - flip back after 1 second
        setTimeout(() => {
          newCards[firstId].isFlipped = false;
          newCards[secondId].isFlipped = false;
          setStage2Cards(newCards);
          setStage2FlippedCards([]);
          setStage2IsProcessing(false);
        }, 1000);
      }
    }
  };

  // ============================================================================
  // TIMER HANDLERS
  // ============================================================================

  const handleStage1Timeout = () => {
    setStage1TimerRunning(false);
    setStage1Data(prev => ({ 
      ...prev, 
      timeTaken: prev.startTime > 0 ? (Date.now() - prev.startTime) / 1000 : STAGE1_CONFIG.timeLimit
    }));
    setTimeout(() => setGameState('stage1Complete'), 500);
  };

  const handleStage2Timeout = () => {
    setStage2TimerRunning(false);
    setStage2Data(prev => ({ 
      ...prev, 
      timeTaken: prev.startTime > 0 ? (Date.now() - prev.startTime) / 1000 : STAGE2_CONFIG.timeLimit
    }));
    setTimeout(() => finishGame(), 500);
  };

  // ============================================================================
  // FINISH GAME & SUBMIT
  // ============================================================================

  const finishGame = async () => {
    setStage2TimerRunning(false);
    setStage2Data(prev => ({ 
      ...prev, 
      timeTaken: prev.timeTaken || (Date.now() - prev.startTime) / 1000 
    }));
    
    if (!sessionPatternType) {
      console.error('No pattern type selected for session');
      return;
    }
    
    try {
      // Calculate scores using our scoring logic
      const scores = calculateScores(
        stage1Data,
        stage2Data,
        stage1Cards,
        stage2Cards,
        stage1PositionMap,
        stage2PositionMap,
        sessionPatternType
      );
      
      // Analyze pattern recognition
      const stage1Analysis = analyzePatternRecognition(
        stage1Data.moves,
        STAGE1_CONFIG.totalPairs,
        STAGE1_CONFIG.totalCards,
        stage1PositionMap,
        sessionPatternType,
        STAGE1_CONFIG.rows,
        STAGE1_CONFIG.cols
      );
      const stage2Analysis = analyzePatternRecognition(
        stage2Data.moves,
        STAGE2_CONFIG.totalPairs,
        STAGE2_CONFIG.totalCards,
        stage2PositionMap,
        sessionPatternType,
        STAGE2_CONFIG.rows,
        STAGE2_CONFIG.cols
      );
      const overallPatternDiscovered = stage1Analysis.patternDiscovered || stage2Analysis.patternDiscovered;
      
      // Extract correct_matches array from moves (for backend)
      // Backend expects: correct_matches: [{pos1, pos2}, ...]
      const extractCorrectMatches = (moves: MoveData[]): Array<{pos1: number, pos2: number}> => {
        const matches: Array<{pos1: number, pos2: number}> = [];
        moves.forEach(move => {
          if (move.isCorrectMatch) {
            matches.push({
              pos1: move.card1Position,
              pos2: move.card2Position
            });
          }
        });
        return matches;
      };

      // Combine correct matches from both stages
      const allCorrectMatches = [
        ...extractCorrectMatches(stage1Data.moves),
        ...extractCorrectMatches(stage2Data.moves)
      ];

      // Get earliest discovery move (or 0 if not discovered)
      const earliestDiscoveryMove = stage1Analysis.discoveryMove > 0 && stage2Analysis.discoveryMove > 0
        ? Math.min(stage1Analysis.discoveryMove, stage2Analysis.discoveryMove)
        : stage1Analysis.discoveryMove > 0
        ? stage1Analysis.discoveryMove
        : stage2Analysis.discoveryMove > 0
        ? stage2Analysis.discoveryMove
        : 0;

      // Prepare raw data for backend in the format it expects
      // Backend calculateCardFlip expects a flat structure, not nested
      const raw_data = {
        correct_pairs: stage1Data.pairsMatched + stage2Data.pairsMatched,
        total_pairs: STAGE1_CONFIG.totalPairs + STAGE2_CONFIG.totalPairs,
        total_flips: stage1Data.totalFlips + stage2Data.totalFlips,
        minimum_flips: STAGE1_CONFIG.minFlips + STAGE2_CONFIG.minFlips,
        time_taken: stage1Data.timeTaken + stage2Data.timeTaken,
        time_limit: STAGE1_CONFIG.timeLimit + STAGE2_CONFIG.timeLimit,
        session_pattern_type: sessionPatternType,
        correct_matches: allCorrectMatches,
        discovery_move: earliestDiscoveryMove
      };

      // Try to submit to backend first
      let gameResult: any = null;
      try {
        gameResult = await submitGame('card_flip_challenge', raw_data, DEFAULT_USER_ID);
      } catch (error) {
        console.warn('Backend submission failed, using frontend scoring:', error);
      }
      
      // If backend doesn't return scores or fails, use frontend-calculated scores
      if (!gameResult || !gameResult.scores) {
        gameResult = {
          session_id: `local-${Date.now()}`,
          version_used: 'V1',
          scores: scores
        };
      }
      
      // Transform to GameResult format
      const finalResult: GameResult = {
        gameId: gameResult.session_id || `local-${Date.now()}`,
        gameName: 'Card Flip Challenge',
        timestamp: new Date(),
        finalScore: gameResult.scores?.final_score || scores.final_score,
        competencies: Object.entries(gameResult.scores?.competencies || scores.competencies).map(([name, data]: [string, any]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          score: data.raw || 0,
          weight: data.weight || 0,
          weightedScore: data.weighted || 0
        })),
        rawData: {
          ...gameResult,
          raw_stats: gameResult.scores?.raw_stats || scores.raw_stats
        }
      };
      
      setResult(finalResult);
      setGameState('results');
    } catch (error) {
      console.error('Error finishing game:', error);
      alert('Failed to calculate scores. Please try again.');
      setGameState('stage2Complete');
    }
  };

  // ============================================================================
  // START GAME
  // ============================================================================

  const startGame = () => {
    // Get the next pattern from rotation queue
    const patternType = getNextPattern();
    setSessionPatternType(patternType);
    initializeStage1(patternType);
    setGameState('stage1');
  };

  const startStage2 = () => {
    // Use the same pattern type for Stage 2
    if (!sessionPatternType) {
      console.error('No pattern type available for Stage 2');
      return;
    }
    initializeStage2(sessionPatternType);
    setGameState('stage2');
  };

  // ============================================================================
  // RENDER CARD GRID
  // ============================================================================

  const renderCardGrid = (
    cards: CardData[],
    rows: number,
    cols: number,
    onCardClick: (id: number) => void
  ) => {
    return (
      <div 
        className="grid gap-2 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: '600px'
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onCardClick(card.id)}
            disabled={card.isMatched || (card.isFlipped && stage1FlippedCards.length >= 2) || (card.isFlipped && stage2FlippedCards.length >= 2)}
            className={`
              aspect-square w-full
              rounded-lg border-2 transition-all duration-300
              flex items-center justify-center text-3xl font-bold
              ${card.isMatched 
                ? 'bg-green-500 border-green-600 text-white cursor-default' 
                : card.isFlipped
                ? 'bg-blue-100 border-blue-400 text-blue-900'
                : 'bg-gray-200 border-gray-300 hover:bg-gray-300 cursor-pointer'
              }
              ${card.isMatched ? 'scale-95' : 'hover:scale-105'}
            `}
          >
            {card.isFlipped || card.isMatched ? card.value : '?'}
          </button>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER INSTRUCTIONS
  // ============================================================================

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="w-6 h-6 text-primary" />
                Card Flip Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  This is a memory and matching game. Find all the matching pairs by flipping cards.
                </p>
                <p className="text-muted-foreground mb-4">
                  Click on two cards to flip them. If they match, they stay face-up. If they don't match, they flip back after 1 second.
                </p>
                <p className="text-muted-foreground mb-4">
                  Complete both stages to finish the game. Good luck!
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Stage 1: 4×5 grid (10 pairs) - 60 seconds</li>
                  <li>• Stage 2: 5×6 grid (15 pairs) - 90 seconds</li>
                  <li>• Click two cards to flip them</li>
                  <li>• Matching pairs stay face-up</li>
                  <li>• Non-matching pairs flip back after 1 second</li>
                </ul>
              </div>
              <Button onClick={startGame} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 1
  // ============================================================================

  if (gameState === 'stage1') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Stage 1 of 2: Find the Pairs
                </CardTitle>
                <Timer
                  key="stage1"
                  isRunning={stage1TimerRunning}
                  initialTime={STAGE1_CONFIG.timeLimit}
                  countDown
                  maxTime={STAGE1_CONFIG.timeLimit}
                  onComplete={handleStage1Timeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <div>
                  Pairs Found: <span className="font-bold">{stage1Data.pairsMatched} / {STAGE1_CONFIG.totalPairs}</span>
                </div>
                <div>
                  Flips: <span className="font-bold">{stage1Data.totalFlips}</span>
                </div>
              </div>
              
              {renderCardGrid(stage1Cards, STAGE1_CONFIG.rows, STAGE1_CONFIG.cols, handleStage1CardClick)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 1 COMPLETE
  // ============================================================================

  if (gameState === 'stage1Complete') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">✓ Stage 1 Complete!</h2>
              <p className="text-muted-foreground">
                Get ready for Stage 2. The grid is larger.
              </p>
              <Button onClick={startStage2} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Stage 2
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 2
  // ============================================================================

  if (gameState === 'stage2') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Stage 2 of 2: Find the Pairs
                </CardTitle>
                <Timer
                  key="stage2"
                  isRunning={stage2TimerRunning}
                  initialTime={STAGE2_CONFIG.timeLimit}
                  countDown
                  maxTime={STAGE2_CONFIG.timeLimit}
                  onComplete={handleStage2Timeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <div>
                  Pairs Found: <span className="font-bold">{stage2Data.pairsMatched} / {STAGE2_CONFIG.totalPairs}</span>
                </div>
                <div>
                  Flips: <span className="font-bold">{stage2Data.totalFlips}</span>
                </div>
              </div>
              
              {renderCardGrid(stage2Cards, STAGE2_CONFIG.rows, STAGE2_CONFIG.cols, handleStage2CardClick)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER STAGE 2 COMPLETE (Before Results)
  // ============================================================================

  if (gameState === 'stage2Complete') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">🎉 Challenge Complete! 🎉</h2>
              <p className="text-muted-foreground">
                Calculating your scores...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER RESULTS
  // ============================================================================

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <ScoreDisplay result={result} gameType="card_flip_challenge" />
          <div className="mt-6 flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CardFlipEasy;
