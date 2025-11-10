import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Play, Lightbulb } from 'lucide-react';
import { submitAIGame, getGameContent } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer';

import { DEFAULT_USER_ID } from '@/lib/api';

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
  return { user: { id: DEFAULT_USER_ID } }; // Uses user ID from .env
};

const GAME_TYPE = 'statement_reasoning';
const TIME_PER_QUESTION = 300; // 5 minutes per question

interface StatementSet {
  id: string | number;
  statements: string[];
  question?: string; // Optional question prompt
}

const StatementReasoning = () => {
  const { user } = useAuth();
  const [statementSets, setStatementSets] = useState<StatementSet[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<GameResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const fetchStatementSets = async () => {
      try {
        setLoading(true);
        const fetchedSets = await getGameContent(GAME_TYPE) as StatementSet[];
        setStatementSets(fetchedSets);
      } catch (error) {
        console.error("Failed to load statement sets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatementSets();
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleSubmitResponse = async () => {
    if (!user || !currentResponse.trim() || statementSets.length === 0) return;

    setSubmitting(true);
    try {
      const currentSet = statementSets[currentSetIndex];
      const timeTaken = (Date.now() - questionStartTime) / 1000;

      const responseData = {
        statements: currentSet.statements,
        response_text: currentResponse,
        response_length: currentResponse.length,
        time_taken: timeTaken,
      };

      // Submit each response individually
      const result = await submitAIGame(GAME_TYPE, responseData, user.id);

      // Move to next set or finish
      if (currentSetIndex < statementSets.length - 1) {
        setIsTimerRunning(false);
        setCurrentResponse('');
        setTimeout(() => {
          setCurrentSetIndex(prev => prev + 1);
          setQuestionStartTime(Date.now());
          setIsTimerRunning(true);
        }, 100);
      } else {
        setFinalScore(result);
        setIsFinished(true);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error("Error submitting statement reasoning response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeout = async () => {
    if (!user || statementSets.length === 0) return;

    setIsTimerRunning(false);
    setSubmitting(true);
    try {
      const currentSet = statementSets[currentSetIndex];
      const timeTaken = TIME_PER_QUESTION; // Use full time limit

      const responseData = {
        statements: currentSet.statements,
        response_text: currentResponse || '', // Submit whatever they have
        response_length: currentResponse.length,
        time_taken: timeTaken,
      };

      const result = await submitAIGame(GAME_TYPE, responseData, user.id);

      if (currentSetIndex < statementSets.length - 1) {
        setCurrentResponse('');
        setTimeout(() => {
          setCurrentSetIndex(prev => prev + 1);
          setQuestionStartTime(Date.now());
          setIsTimerRunning(true);
        }, 100);
      } else {
        setFinalScore(result);
        setIsFinished(true);
      }
    } catch (error) {
      console.error("Error submitting on timeout:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Instructions screen
  if (!gameStarted) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading statement sets...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (statementSets.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No statement sets available.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl">Statement Reasoning</CardTitle>
                <CardDescription>Analyze connections between statements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">How to Play:</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>1️⃣ <strong>Read the statements</strong> - You'll see {statementSets.length} sets of statements</li>
                <li>2️⃣ <strong>Analyze the connection</strong> - Explain how the statements relate to each other</li>
                <li>3️⃣ <strong>Write your reasoning</strong> - Provide a clear, logical explanation</li>
                <li>4️⃣ <strong>Time limit:</strong> {TIME_PER_QUESTION / 60} minutes per set</li>
              </ul>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                💡 Tip: Focus on logical connections, cause-and-effect relationships, or underlying patterns between the statements.
              </p>
            </div>

            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading/Submitting state
  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Submitting your response...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (isFinished && finalScore) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <ScoreDisplay result={finalScore} gameType={GAME_TYPE} />
          <div className="mt-6 flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game playing screen
  const currentSet = statementSets[currentSetIndex];
  const isLastSet = currentSetIndex === statementSets.length - 1;

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Statement Reasoning</CardTitle>
                <CardDescription>
                  Set {currentSetIndex + 1} of {statementSets.length}
                </CardDescription>
              </div>
              <Timer
                isRunning={isTimerRunning}
                initialTime={TIME_PER_QUESTION}
                countDown
                maxTime={TIME_PER_QUESTION}
                onComplete={handleTimeout}
                key={currentSetIndex} // Reset timer for each question
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statements Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Statements:</h3>
              <div className="space-y-3">
                {currentSet.statements.map((statement, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-muted rounded-lg border-l-4 border-primary"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <p className="flex-1 text-sm leading-relaxed">{statement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Prompt (if available) */}
            {currentSet.question && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="font-medium text-primary mb-1">Question:</p>
                <p className="text-sm">{currentSet.question}</p>
              </div>
            )}

            {/* Response Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Explain the connection or reasoning between these statements:
              </label>
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your reasoning here... Be clear and logical in explaining how these statements connect."
                className="min-h-[200px] text-base"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {currentResponse.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitResponse}
              disabled={!currentResponse.trim()}
              size="lg"
              className="w-full"
            >
              {isLastSet ? 'Finish & Submit' : 'Submit and Go to Next Set'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatementReasoning;

