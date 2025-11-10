import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, Play } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame } from '@/lib/api';

// Problem sequence
const PROBLEMS = [
  { id: 1, startValue: 107, operand: 9, operator: '-' as const, correctAnswer: 98 },
  { id: 2, startValue: 108, operand: 11, operator: '+' as const, correctAnswer: 119 },
  { id: 3, startValue: 103, operand: 6, operator: '-' as const, correctAnswer: 97 },
  { id: 4, startValue: 109, operand: 14, operator: '+' as const, correctAnswer: 123 },
  { id: 5, startValue: 102, operand: 13, operator: '-' as const, correctAnswer: 89 },
  { id: 6, startValue: 101, operand: 7, operator: '+' as const, correctAnswer: 108 },
  { id: 7, startValue: 107, operand: 15, operator: '-' as const, correctAnswer: 92 },
  { id: 8, startValue: 109, operand: 19, operator: '+' as const, correctAnswer: 128 },
  { id: 9, startValue: 106, operand: 10, operator: '-' as const, correctAnswer: 96 },
  { id: 10, startValue: 105, operand: 13, operator: '+' as const, correctAnswer: 118 },
];

type GameState = 'instructions' | 'playing' | 'results';

const MentalMathEasy = () => {
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [currentProblem, setCurrentProblem] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(100);
  const [userAnswer, setUserAnswer] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timePerQuestion = 5; // Default 5 seconds

  const startGame = () => {
    setGameState('playing');
    setCurrentProblem(0);
    setCurrentBalance(PROBLEMS[0].startValue);
    setResponses([]);
    setUserAnswer('');
    setGameStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    
    const problem = PROBLEMS[currentProblem];
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const userNum = parseInt(userAnswer) || 0;
    const isCorrect = userNum === problem.correctAnswer;

    const response = {
      problemId: problem.id,
      operand: problem.operand,
      operator: problem.operator,
      previousBalance: currentBalance,
      correctAnswer: problem.correctAnswer,
      userAnswer: userNum,
      isCorrect,
      timeTaken,
      maxAllowedTime: timePerQuestion,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentProblem < PROBLEMS.length - 1) {
      const nextProblem = PROBLEMS[currentProblem + 1];
      setCurrentProblem(currentProblem + 1);
      setCurrentBalance(nextProblem.startValue);
      setUserAnswer('');
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true); // Simply restart the timer
    } else {
      finishGame(newResponses);
    }
  };

  const handleTimeout = () => {
    const problem = PROBLEMS[currentProblem];
    const response = {
      problemId: problem.id,
      operand: problem.operand,
      operator: problem.operator,
      previousBalance: currentBalance,
      correctAnswer: problem.correctAnswer,
      userAnswer: 0,
      isCorrect: false,
      timeTaken: timePerQuestion,
      maxAllowedTime: timePerQuestion,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentProblem < PROBLEMS.length - 1) {
      const nextProblem = PROBLEMS[currentProblem + 1];
      setCurrentProblem(currentProblem + 1);
      setCurrentBalance(nextProblem.startValue);
      setUserAnswer('');
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true); // Simply restart the timer
    } else {
      finishGame(newResponses);
    }
  };

  const finishGame = async (finalResponses: any[]) => {
    setIsTimerRunning(false);
    
    try {
      // Transform data to match backend's expected format
      const raw_data = finalResponses.map(r => ({
        problem: `${r.previousBalance} ${r.operator} ${r.operand}`,
        user_answer: r.userAnswer,
        correct_answer: r.correctAnswer,
        is_correct: r.isCorrect,
        time_taken: r.timeTaken
      }));
      
      // Submit to backend for scoring
      const result = await submitGame('mental_math_sprint', raw_data);
      
      // Backend returns the full game result with scores
      if (result && result.scores) {
        setResult(result);
        setGameState('results');
      } else {
        console.error('Invalid result from backend:', result);
        alert('Failed to get scores. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting game:', error);
      alert('Failed to submit game. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calculator className="w-6 h-6 text-primary" />
                Mental Math Sprint - Easy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  Solve {PROBLEMS.length} mental math problems as quickly and accurately as possible.
                  Each problem starts with a new number and you need to perform the operation.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {PROBLEMS.length} math problems</li>
                  <li>• {timePerQuestion} seconds per problem</li>
                  <li>• Each question starts with a new number</li>
                  <li>• Tests speed, accuracy, and mental stamina</li>
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

  if (gameState === 'playing') {
    const problem = PROBLEMS[currentProblem];
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Mental Math Sprint
                </CardTitle>
                <Timer
                  key={currentProblem} // Add key to force re-render and reset timer
                  isRunning={isTimerRunning}
                  initialTime={timePerQuestion}
                  countDown
                  maxTime={timePerQuestion}
                  onComplete={handleTimeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar current={currentProblem + 1} total={PROBLEMS.length} />
              
              <div className="text-center space-y-6">
                <div className="text-sm text-muted-foreground">
                  Current Balance: {currentBalance}
                </div>
                
                <div className="text-5xl font-bold">
                  {currentBalance} {problem.operator} {problem.operand} = ?
                </div>

                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your answer"
                  className="text-center text-2xl"
                  autoFocus
                />

                <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!userAnswer.trim()}>
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <ScoreDisplay result={result} gameType="mental_math_sprint" />
        </div>
      </div>
    );
  }

  return null;
};

export default MentalMathEasy;
