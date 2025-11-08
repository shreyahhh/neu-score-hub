// Transform backend response format to frontend GameResult format
import { GameResult, CompetencyScore } from './types';

/**
 * Transform backend game submission response to GameResult
 */
export function transformGameResult(
  backendData: any,
  gameType: string,
  gameName?: string
): GameResult {
  // Backend returns: { session_id, version_used, scores: {...} } for action games
  // or { session_id, version_used, ai_scores: {...}, final_scores: {...} } for AI games
  
  const scores = backendData.scores || backendData.final_scores || {};
  const competencies = scores.competencies || {};
  
  // Transform competencies to frontend format
  const competencyScores: CompetencyScore[] = Object.entries(competencies).map(([name, data]: [string, any]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: data.raw || 0,
    weight: data.weight || 0,
    weightedScore: data.weighted || 0
  }));

  return {
    gameId: backendData.session_id || '',
    gameName: gameName || gameType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    timestamp: new Date(),
    finalScore: scores.final_score || 0,
    competencies: competencyScores,
    rawData: {
      ...backendData,
      version_used: backendData.version_used,
      raw_stats: scores.raw_stats || {}
    }
  };
}

/**
 * Get game display name from game type
 */
export function getGameDisplayName(gameType: string): string {
  const names: Record<string, string> = {
    mental_math_sprint: 'Mental Math Sprint',
    stroop_test: 'Stroop Test',
    sign_sudoku: 'Sign Sudoku',
    face_name_match: 'Face-Name Match',
    card_flip_challenge: 'Card Flip Challenge',
    scenario_challenge: 'Scenario Challenge',
    ai_debate: 'AI Debate',
    creative_uses: 'Creative Uses',
    statement_reasoning: 'Statement Reasoning',
    vocab_challenge: 'Vocab Challenge',
    lucky_flip: 'Lucky Flip'
  };
  return names[gameType] || gameType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

