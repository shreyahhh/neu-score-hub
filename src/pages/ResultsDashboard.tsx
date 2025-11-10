import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, TrendingUp, Clock, Play } from 'lucide-react';
import { getResultsHistory } from '@/lib/api';
import { getGameDisplayName } from '@/lib/transformers';

import { DEFAULT_USER_ID } from '@/lib/api';

// All game types in the system
const ALL_GAME_TYPES = [
  'mental_math_sprint',
  'stroop_test',
  'sign_sudoku',
  'face_name_match',
  'card_flip_challenge',
  'scenario_challenge',
  'ai_debate',
  'creative_uses',
  'statement_reasoning',
  'vocab_challenge',
  'lucky_flip',
];

interface GameSummary {
  game_type: string;
  best_score: number;
  avg_score: number;
  total_attempts: number;
  last_played: string | null;
  active_version: string | null;
  hasData: boolean;
}

const ResultsDashboard = () => {
  const [summaries, setSummaries] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState({
    totalGames: 0,
    totalSessions: 0,
    avgScore: 0,
  });

  useEffect(() => {
    loadAllResults();
  }, []);

  const loadAllResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryPromises = ALL_GAME_TYPES.map(async (gameType) => {
        try {
          const sessions = await getResultsHistory(gameType, DEFAULT_USER_ID);
          
          if (!sessions || sessions.length === 0) {
            return {
              game_type: gameType,
              best_score: 0,
              avg_score: 0,
              total_attempts: 0,
              last_played: null,
              active_version: null,
              hasData: false,
            };
          }

          const scores = sessions
            .map((s: any) => s.final_scores?.final_score || s.scores?.final_score || 0)
            .filter((score: number) => score > 0);

          if (scores.length === 0) {
            return {
              game_type: gameType,
              best_score: 0,
              avg_score: 0,
              total_attempts: sessions.length,
              last_played: sessions[0]?.created_at || null,
              active_version: sessions[0]?.scoring_version?.version_name || null,
              hasData: false,
            };
          }

          const bestScore = Math.max(...scores);
          const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
          const lastSession = sessions[0]; // Most recent is first

          return {
            game_type: gameType,
            best_score: bestScore,
            avg_score: avgScore,
            total_attempts: sessions.length,
            last_played: lastSession?.created_at || null,
            active_version: lastSession?.scoring_version?.version_name || 'V1',
            hasData: true,
          };
        } catch (err) {
          console.error(`Error loading ${gameType}:`, err);
          return {
            game_type: gameType,
            best_score: 0,
            avg_score: 0,
            total_attempts: 0,
            last_played: null,
            active_version: null,
            hasData: false,
          };
        }
      });

      const results = await Promise.all(summaryPromises);
      setSummaries(results);

      // Calculate overall stats
      const gamesWithData = results.filter(r => r.hasData);
      const totalSessions = results.reduce((sum, r) => sum + r.total_attempts, 0);
      const allScores = results
        .filter(r => r.hasData)
        .flatMap(r => [r.avg_score]);
      const overallAvg = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;

      setOverallStats({
        totalGames: gamesWithData.length,
        totalSessions,
        avgScore: overallAvg,
      });
    } catch (err) {
      console.error('Error loading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary" />
            Your Results Dashboard
          </h1>
          <p className="text-muted-foreground">
            View your performance across all cognitive games
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Overall Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallStats.totalGames}</div>
              <p className="text-sm text-muted-foreground mt-2">
                out of {ALL_GAME_TYPES.length} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallStats.totalSessions}</div>
              <p className="text-sm text-muted-foreground mt-2">
                across all games
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {overallStats.avgScore > 0 ? overallStats.avgScore.toFixed(1) : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                across all games
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Games Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Games Performance</CardTitle>
            <CardDescription>
              Click on any game to view detailed history and compare versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summaries.map((summary) => {
                const gameName = getGameDisplayName(summary.game_type);
                const scoreColor = summary.avg_score >= 80 
                  ? 'text-success' 
                  : summary.avg_score >= 60 
                  ? 'text-primary' 
                  : summary.avg_score >= 40 
                  ? 'text-accent' 
                  : 'text-destructive';

                return (
                  <Card 
                    key={summary.game_type}
                    className="hover:border-primary transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{gameName}</h3>
                            {summary.active_version && (
                              <span className="text-xs px-2 py-1 bg-muted rounded">
                                {summary.active_version} Active
                              </span>
                            )}
                          </div>
                          
                          {summary.hasData ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Best: <strong className={scoreColor}>{summary.best_score.toFixed(1)}</strong></span>
                                <span>Avg: <strong className={scoreColor}>{summary.avg_score.toFixed(1)}</strong></span>
                                <span>{summary.total_attempts} attempts</span>
                                <span>Last: {formatDate(summary.last_played)}</span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-gradient-primary h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, summary.avg_score)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No attempts yet. Play this game to see your results!
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {summary.hasData ? (
                            <>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                              >
                                <Link to={`/results/${summary.game_type}`}>
                                  View History
                                </Link>
                              </Button>
                              <Button
                                asChild
                                size="sm"
                              >
                                <Link to={`/games/${getGameRoute(summary.game_type)}`}>
                                  Play Again
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <Button
                              asChild
                              size="sm"
                            >
                              <Link to={`/games/${getGameRoute(summary.game_type)}`}>
                                Play Now
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper to get game route from game type
function getGameRoute(gameType: string): string {
  const routeMap: Record<string, string> = {
    'mental_math_sprint': 'mental-math-easy',
    'stroop_test': 'stroop-test-standard',
    'sign_sudoku': 'pattern-sudoku',
    'face_name_match': 'face-name-match-easy',
    'card_flip_challenge': 'card-flip-easy',
    'scenario_challenge': 'scenario-challenge',
    'ai_debate': 'debate-mode',
    'creative_uses': 'creative-uses',
    'statement_reasoning': 'statement-reasoning',
    'vocab_challenge': 'vocab-challenge',
    'lucky_flip': 'lucky-flip',
  };
  return routeMap[gameType] || gameType;
}

export default ResultsDashboard;

