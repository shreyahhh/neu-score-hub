import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';
import { submitAIGame, getGameContent } from '../../lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer'; // Import Timer component

import { DEFAULT_USER_ID } from '@/lib/api';

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
  return { user: { id: DEFAULT_USER_ID } }; // Uses user ID from .env
};

const GAME_TYPE = 'interview';
// Per prompt, AI games should use 'scenario_challenge' type for submission
const SUBMISSION_GAME_TYPE = 'scenario_challenge';
const TIME_PER_QUESTION = 300; // 5 minutes per question

interface InterviewQuestion {
  id: string | number;
  text: string;
  competency: string;
}

const Interview = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<GameResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0); // Track start time for each question
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Control timer
  const [gameStarted, setGameStarted] = useState(false); // Track if game has started

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await getGameContent(GAME_TYPE) as InterviewQuestion[];
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Failed to load interview questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setQuestionStartTime(Date.now()); // Start timer for the first question
    setIsTimerRunning(true); // Start timer
  };

  const handleSubmitAnswer = async () => {
    if (!user || !currentAnswer.trim()) return;

    setSubmitting(true);
    try {
      const question = questions[currentQuestionIndex];
      const timeTaken = (Date.now() - questionStartTime) / 1000; // Calculate time taken

      const responseData = {
        scenario_text: "Interview Question", // Using placeholder as per prompt
        question_text: question.text,
        response_text: currentAnswer,
        response_length: currentAnswer.length,
        time_taken: timeTaken, // Include time_taken
      };

      // Submit each answer and get a score
      const result = await submitAIGame(SUBMISSION_GAME_TYPE, responseData, user.id);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setIsTimerRunning(false); // Stop timer first
        setCurrentAnswer('');
        // Use setTimeout to ensure state updates properly
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setQuestionStartTime(Date.now()); // Reset timer for next question
          setIsTimerRunning(true); // Restart timer
        }, 100);
      } else {
        setFinalScore(result); // Set the final score from the last submission
        setIsFinished(true);
        setIsTimerRunning(false); // Stop timer when game finishes
      }
    } catch (error) {
      console.error("Error submitting interview answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeout = async () => {
    if (!user || !questions[currentQuestionIndex]) return;

    setSubmitting(true);
    try {
      const question = questions[currentQuestionIndex];
      const responseData = {
        scenario_text: "Interview Question",
        question_text: question.text,
        response_text: '', // Empty response for timeout
        response_length: 0,
        time_taken: TIME_PER_QUESTION, // Max time taken for timeout
      };

      const result = await submitAIGame(SUBMISSION_GAME_TYPE, responseData, user.id);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
        setQuestionStartTime(Date.now()); // Reset timer for next question
        setIsTimerRunning(true); // Restart timer
      } else {
        setFinalScore(result);
        setIsFinished(true);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error("Error handling timeout:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isFinished && finalScore) {
    return <ScoreDisplay result={finalScore} gameType={SUBMISSION_GAME_TYPE} />;
  }

  if (questions.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!gameStarted) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                Interview Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  Answer {questions.length} interview questions thoughtfully. Take your time to provide detailed responses.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {questions.length} questions</li>
                  <li>• {TIME_PER_QUESTION / 60} minutes per question</li>
                  <li>• Answer each question thoroughly</li>
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

  return (
    <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Interview Challenge</CardTitle>
          <Timer
            key={currentQuestionIndex} // Key to force re-render and reset timer
            isRunning={isTimerRunning}
            initialTime={TIME_PER_QUESTION}
            countDown
            maxTime={TIME_PER_QUESTION}
            onComplete={handleTimeout}
          />
        </div>
        <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </CardHeader>
      <CardContent>
        {questions.length > 0 && (
          <div className="space-y-4">
            <p className="font-semibold">{questions[currentQuestionIndex].text}</p>
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
            />
            <Button onClick={handleSubmitAnswer} disabled={submitting || !currentAnswer.trim()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish & Submit'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default Interview;