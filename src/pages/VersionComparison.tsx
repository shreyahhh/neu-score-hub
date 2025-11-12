import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getResultsHistory, getAllScoringVersions, loadActiveGameConfig } from '@/lib/api';
import { getGameDisplayName, transformGameResult } from '@/lib/transformers';
import { GameResult } from '@/lib/types';

import { DEFAULT_USER_ID } from '@/lib/api';

interface Session {
  id: string;
  created_at: string;
  final_scores?: any;
  scores?: any;
  scoring_version?: {
    version_name: string;
    description?: string;
  };
}

interface VersionConfig {
  version_name: string;
  config: {
    final_weights: Record<string, number>;
    competency_formulas?: Record<string, string>;
  };
}

interface VersionChange {
  competency: string;
  oldWeight: number;
  newWeight: number;
  diff: number;
}

const VersionComparison = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionIds = searchParams.get('sessions')?.split(',').filter(Boolean) || [];
  const [sessions, setSessions] = useState<Session[]>([]);
  const [versions, setVersions] = useState<VersionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameType && sessionIds.length > 0) {
      loadComparisonData();
    }
  }, [gameType, sessionIds]);

  const loadComparisonData = async () => {
    if (!gameType) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('[VersionComparison] Loading comparison data for:', { gameType, sessionIds });

      // Load all sessions for this game
      const allSessions = await getResultsHistory(gameType, DEFAULT_USER_ID);
      console.log('[VersionComparison] Loaded sessions:', allSessions.length, allSessions);
      console.log('[VersionComparison] Looking for session IDs:', sessionIds);
      
      // Filter sessions - try both exact match and string comparison
      const selectedSessions = allSessions.filter((s: Session) => {
        const matches = sessionIds.includes(s.id) || sessionIds.includes(String(s.id));
        if (matches) {
          console.log('[VersionComparison] Found matching session:', s.id, s);
        }
        return matches;
      }).sort((a: Session, b: Session) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[VersionComparison] Selected sessions:', selectedSessions.length, selectedSessions);

      if (selectedSessions.length === 0) {
        console.error('[VersionComparison] No sessions matched. Available IDs:', allSessions.map((s: Session) => s.id));
        throw new Error(`No sessions found with the provided IDs. Found ${allSessions.length} total sessions for this game.`);
      }

      if (selectedSessions.length < 2) {
        throw new Error('Please select at least 2 sessions to compare');
      }

      setSessions(selectedSessions);

      // Load version configs
      const versionData = await getAllScoringVersions(gameType);
      console.log('[VersionComparison] Loaded versions:', versionData);
      setVersions(versionData || []);
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const compareVersionConfigs = (): VersionChange[] => {
    if (versions.length < 2) return [];

    // Get unique versions from sessions
    const sessionVersions = [...new Set(
      sessions.map(s => s.scoring_version?.version_name).filter(Boolean)
    )] as string[];

    if (sessionVersions.length < 2) return [];

    // Sort versions to compare V1 vs V2, V2 vs V3, etc.
    const sortedVersions = sessionVersions.sort();
    const changes: VersionChange[] = [];

    for (let i = 0; i < sortedVersions.length - 1; i++) {
      const v1Name = sortedVersions[i];
      const v2Name = sortedVersions[i + 1];
      
      const v1 = versions.find(v => v.version_name === v1Name);
      const v2 = versions.find(v => v.version_name === v2Name);

      if (!v1 || !v2) continue;

      const v1Weights = v1.config.final_weights || {};
      const v2Weights = v2.config.final_weights || {};

      // Compare all competencies
      const allKeys = new Set([...Object.keys(v1Weights), ...Object.keys(v2Weights)]);
      
      allKeys.forEach(key => {
        const oldWeight = v1Weights[key] || 0;
        const newWeight = v2Weights[key] || 0;
        
        if (oldWeight !== newWeight) {
          changes.push({
            competency: key,
            oldWeight,
            newWeight,
            diff: newWeight - oldWeight,
          });
        }
      });
    }

    return changes;
  };

  const calculateImpact = (session1: Session, session2: Session, changes: VersionChange[]) => {
    const score1 = session1.final_scores?.final_score || session1.scores?.final_score || 0;
    const score2 = session2.final_scores?.final_score || session2.scores?.final_score || 0;
    const diff = score2 - score1;

    const impacts = changes.map(change => {
      const comp1 = session1.final_scores?.competencies?.[change.competency] || 
                    session1.scores?.competencies?.[change.competency];
      const comp2 = session2.final_scores?.competencies?.[change.competency] || 
                    session2.scores?.competencies?.[change.competency];

      if (!comp1 || !comp2) return null;

      const weighted1 = comp1.weighted || 0;
      const weighted2 = comp2.weighted || 0;
      const impact = weighted2 - weighted1;

      return {
        competency: change.competency,
        impact,
        change: change.diff,
      };
    }).filter(Boolean);

    return { totalDiff: diff, impacts };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading comparison...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !gameType || sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error || 'No sessions to compare'}
            </p>
            <Button asChild>
              <Link to={`/results/${gameType}`}>Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameName = getGameDisplayName(gameType);
  const versionChanges = compareVersionConfigs();
  const impact = sessions.length >= 2 
    ? calculateImpact(sessions[0], sessions[1], versionChanges)
    : null;

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="mb-4"
          >
            <Link to={`/results/${gameType}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">{gameName} - Compare Results</h1>
          <p className="text-muted-foreground">
            Comparing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Session Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sessions.map((session, idx) => {
            const score = session.final_scores?.final_score || session.scores?.final_score || 0;
            const version = session.scoring_version?.version_name || 'Unknown';
            const date = new Date(session.created_at);
            const competencies = session.final_scores?.competencies || session.scores?.competencies || {};

            return (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>Session {idx + 1}</CardTitle>
                  <CardDescription>
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Version</div>
                    <div className="text-lg font-semibold">{version}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Final Score</div>
                    <div className={`text-3xl font-bold ${
                      score >= 80 ? 'text-success' :
                      score >= 60 ? 'text-primary' :
                      score >= 40 ? 'text-accent' : 'text-destructive'
                    }`}>
                      {score.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Competencies</div>
                    <div className="space-y-1">
                      {Object.entries(competencies).slice(0, 5).map(([name, data]: [string, any]) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="capitalize">{name.replace(/_/g, ' ')}</span>
                          <span className="font-medium">
                            {data.weighted?.toFixed(1) || '0.0'} ({(data.weight * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Score Breakdown Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Score Breakdown Comparison</CardTitle>
            <CardDescription>
              Detailed competency breakdown for each session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Competency</th>
                    {sessions.map((_, idx) => (
                      <th key={idx} className="text-center p-3">
                        Session {idx + 1}
                        <div className="text-xs font-normal text-muted-foreground mt-1">
                          {sessions[idx].scoring_version?.version_name || 'Unknown'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Get all unique competencies
                    const allCompetencies = new Set<string>();
                    sessions.forEach(s => {
                      const comps = s.final_scores?.competencies || s.scores?.competencies || {};
                      Object.keys(comps).forEach(key => allCompetencies.add(key));
                    });

                    return Array.from(allCompetencies).map(compName => (
                      <tr key={compName} className="border-b">
                        <td className="p-3 font-medium capitalize">
                          {compName.replace(/_/g, ' ')}
                        </td>
                        {sessions.map((session, idx) => {
                          const comps = session.final_scores?.competencies || session.scores?.competencies || {};
                          const comp = comps[compName];
                          
                          if (!comp) {
                            return (
                              <td key={idx} className="p-3 text-center text-muted-foreground">
                                N/A
                              </td>
                            );
                          }

                          return (
                            <td key={idx} className="p-3 text-center">
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {comp.weighted?.toFixed(1) || comp.weightedScore?.toFixed(1) || '0.0'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Raw: {comp.raw?.toFixed(1) || comp.score?.toFixed(1) || '0.0'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Weight: {(comp.weight * 100).toFixed(0)}%
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                  <tr className="border-t-2 font-bold">
                    <td className="p-3">TOTAL</td>
                    {sessions.map((session, idx) => {
                      const score = session.final_scores?.final_score || session.scores?.final_score || 0;
                      return (
                        <td key={idx} className="p-3 text-center text-lg">
                          {score.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Version Changes */}
        {versionChanges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Changed Between Versions?</CardTitle>
              <CardDescription>
                Configuration changes that affected scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versionChanges.map((change, idx) => {
                  const isIncrease = change.diff > 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold capitalize mb-1">
                          {change.competency.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Weight changed from {(change.oldWeight * 100).toFixed(0)}% to {(change.newWeight * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 text-lg font-semibold ${
                        isIncrease ? 'text-success' : 'text-destructive'
                      }`}>
                        {isIncrease ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        {isIncrease ? '+' : ''}{(change.diff * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {impact && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <h3 className="font-semibold mb-2">Impact on Scores</h3>
                  <div className="space-y-2 text-sm">
                    {impact.impacts.map((imp: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="capitalize">{imp.competency.replace(/_/g, ' ')}:</span>
                        <span className={`font-medium ${
                          imp.impact > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {imp.impact > 0 ? '+' : ''}{imp.impact.toFixed(2)} points
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between font-semibold">
                      <span>Net Change:</span>
                      <span className={impact.totalDiff > 0 ? 'text-success' : 'text-destructive'}>
                        {impact.totalDiff > 0 ? '+' : ''}{impact.totalDiff.toFixed(2)} points
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/results/${gameType}`)}
          >
            Back to History
          </Button>
          <Button
            onClick={() => {
              const gameRoute = getGameRoute(gameType!);
              navigate(`/games/${gameRoute}`);
            }}
          >
            Play Again
          </Button>
        </div>
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

export default VersionComparison;

