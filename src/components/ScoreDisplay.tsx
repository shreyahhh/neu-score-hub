import React from 'react';
import { GameResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';

interface ScoreDisplayProps {
  result: GameResult;
}

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Final Score Card */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Final Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.finalScore)}`}>
              {result.finalScore.toFixed(1)}
            </div>
            <div className="text-xl text-muted-foreground mt-2">
              {getScoreLabel(result.finalScore)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {result.gameName} {result.difficulty && `- ${result.difficulty}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Competency Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.competencies.map((competency, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{competency.name}</span>
                  <div className="text-right">
                    <span className={`font-bold ${getScoreColor(competency.score)}`}>
                      {competency.score.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (weight: {(competency.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${competency.score}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Weighted: {competency.weightedScore.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Table */}
          <div className="mt-6 border-t pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Competency</th>
                  <th className="text-right py-2">Raw Score</th>
                  <th className="text-right py-2">Weight</th>
                  <th className="text-right py-2">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {result.competencies.map((competency, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{competency.name}</td>
                    <td className="text-right">{competency.score.toFixed(1)}</td>
                    <td className="text-right">{(competency.weight * 100).toFixed(0)}%</td>
                    <td className="text-right font-medium">{competency.weightedScore.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2">Total</td>
                  <td></td>
                  <td></td>
                  <td className="text-right text-primary">{result.finalScore.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
