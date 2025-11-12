import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getResultsHistory } from '@/lib/api';
import { getGameDisplayName, transformGameResult } from '@/lib/transformers';
import { GameResult } from '@/lib/types';

import { DEFAULT_USER_ID } from '@/lib/api';

interface Session {
  id: string;
  created_at: string;
  completed_at: string;
  final_scores?: any;
  scores?: any;
  scoring_version?: {
    version_name: string;
    description?: string;
  };
}

const GameResultsHistory = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  useEffect(() => {
    if (gameType) {
      loadHistory();
    }
  }, [gameType]);

  const loadHistory = async () => {
    if (!gameType) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getResultsHistory(gameType, DEFAULT_USER_ID);
      // Sort by most recent first
      const sorted = (data || []).sort((a: Session, b: Session) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(sorted);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };


  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };



  const stats = sessions.length > 0 ? {
    best: Math.max(...sessions.map(s => s.final_scores?.final_score || s.scores?.final_score || 0)),
    latest: sessions[0]?.final_scores?.final_score || sessions[0]?.scores?.final_score || 0,
    total: sessions.length,
    avg: sessions.reduce((sum, s) => {
      const score = s.final_scores?.final_score || s.scores?.final_score || 0;
      return sum + score;
    }, 0) / sessions.length,
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameType) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Invalid game type</p>
            <Button asChild className="mt-4">
              <Link to="/results">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameName = getGameDisplayName(gameType);

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="mb-4"
          >
            <Link to="/results">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Results
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">{gameName} - History</h1>
          <p className="text-muted-foreground">
            View and compare all your attempts for this game
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.best.toFixed(1)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.latest.toFixed(1)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg: {stats.avg.toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Attempts</CardTitle>
            <CardDescription>
              Select multiple sessions to compare versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No attempts yet. Play this game to see your results!
                </p>
                {sessions.length === 0 && (
                  <Button asChild>
                    <Link to={`/games/${getGameRoute(gameType)}`}>
                      Play Now
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">
                        <Checkbox
                          checked={selectedSessions.length === sessions.length && sessions.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSessions(sessions.map(s => s.id));
                            } else {
                              setSelectedSessions([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Version</th>
                      <th className="text-left p-3">Score</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const score = session.final_scores?.final_score || session.scores?.final_score || 0;
                      const version = session.scoring_version?.version_name || 'Unknown';
                      const date = new Date(session.created_at);
                      
                      return (
                        <tr key={session.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedSessions.includes(session.id)}
                              onCheckedChange={() => handleSessionToggle(session.id)}
                            />
                          </td>
                          <td className="p-3">
                            {date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-muted rounded text-sm">
                              {version}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`font-semibold ${
                              score >= 80 ? 'text-success' :
                              score >= 60 ? 'text-primary' :
                              score >= 40 ? 'text-accent' : 'text-destructive'
                            }`}>
                              {score.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to score detail view
                                const result = transformGameResult(session, gameType);
                                // You could create a detail modal or page here
                                alert(`Score: ${score.toFixed(2)}\nVersion: ${version}\nDate: ${date.toLocaleString()}`);
                              }}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper to get game route
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

export default GameResultsHistory;

