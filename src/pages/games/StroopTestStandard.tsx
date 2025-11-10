import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Play } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame } from '@/lib/api';

// Hardcoded questions - always use these 10 questions
const QUESTIONS = [
  { id: 1, word: "RED", color: "green", correctAnswer: "green", task: 'name_color', correct: 'green', options: ['red', 'green', 'blue', 'yellow'], interference: true },
  { id: 2, word: "BLUE", color: "red", correctAnswer: "red", task: 'name_color', correct: 'red', options: ['red', 'blue', 'green', 'yellow'], interference: true },
  { id: 3, word: "GREEN", color: "blue", correctAnswer: "blue", task: 'name_color', correct: 'blue', options: ['green', 'blue', 'red', 'yellow'], interference: true },
  { id: 4, word: "YELLOW", color: "red", correctAnswer: "red", task: 'name_color', correct: 'red', options: ['yellow', 'red', 'blue', 'green'], interference: true },
  { id: 5, word: "RED", color: "blue", correctAnswer: "blue", task: 'name_color', correct: 'blue', options: ['red', 'blue', 'green', 'yellow'], interference: true },
  { id: 6, word: "BLUE", color: "green", correctAnswer: "green", task: 'name_color', correct: 'green', options: ['blue', 'green', 'red', 'yellow'], interference: true },
  { id: 7, word: "GREEN", color: "yellow", correctAnswer: "yellow", task: 'name_color', correct: 'yellow', options: ['green', 'yellow', 'red', 'blue'], interference: true },
  { id: 8, word: "YELLOW", color: "blue", correctAnswer: "blue", task: 'name_color', correct: 'blue', options: ['yellow', 'blue', 'red', 'green'], interference: true },
  { id: 9, word: "RED", color: "yellow", correctAnswer: "yellow", task: 'name_color', correct: 'yellow', options: ['red', 'yellow', 'blue', 'green'], interference: true },
  { id: 10, word: "BLUE", color: "yellow", correctAnswer: "yellow", task: 'name_color', correct: 'yellow', options: ['blue', 'yellow', 'red', 'green'], interference: true }
];

// Color mapping for display
const COLOR_MAP: Record<string, string> = {
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00'
};

type GameState = 'instructions' | 'playing' | 'results';

const StroopTestStandard = () => {
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timePerQuestion = 3; // 3 seconds per question

  const startGame = () => {
    // Use hardcoded questions
    setCurrentQuestionIndex(0);
    setResponses([]);
    setGameState('playing');
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleAnswer = (answer: string) => {
    const question = QUESTIONS[currentQuestionIndex];
    const responseTime = Date.now() - questionStartTime;
    const isCorrect = answer.toLowerCase() === question.correct.toLowerCase();

    const response = {
      questionId: question.id,
      word: question.word,
      color: question.color,
      task: question.task,
      userAnswer: answer,
      correctAnswer: question.correct,
      isCorrect,
      responseTime,
      hadInterference: question.interference || false,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setIsTimerRunning(true); // Restart timer
    } else {
      finishGame(newResponses);
    }
  };

  const handleTimeout = () => {
    const question = QUESTIONS[currentQuestionIndex];
    const response = {
      questionId: question.id,
      word: question.word,
      color: question.color,
      task: question.task,
      userAnswer: null,
      correctAnswer: question.correct,
      isCorrect: false,
      responseTime: timePerQuestion * 1000,
      hadInterference: question.interference || false,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
        word: r.word,
        color: r.color,
        user_response: r.userAnswer,
        is_correct: r.isCorrect,
        is_interference: r.hadInterference,
        time_taken: r.responseTime / 1000
      }));
      
      // Submit to backend for scoring
      const result = await submitGame('stroop_test', raw_data);
      
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

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Eye className="w-6 h-6 text-primary" />
                Stroop Test - Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  You will see words displayed in different colors. Your task will be either:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Read the word</strong> - Select what the word says (ignore the color)</li>
                  <li><strong>Name the color</strong> - Select the color of the text (ignore the word)</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {QUESTIONS.length} questions</li>
                  <li>• {timePerQuestion} seconds per question</li>
                  <li>• No feedback during the game</li>
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
    const question = QUESTIONS[currentQuestionIndex];
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Stroop Test
                </CardTitle>
                <Timer
                  key={currentQuestionIndex} // Add key to force re-render and reset timer
                  isRunning={isTimerRunning}
                  initialTime={timePerQuestion}
                  countDown
                  maxTime={timePerQuestion}
                  onComplete={handleTimeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar current={currentQuestionIndex + 1} total={QUESTIONS.length} />
              
              <div className="text-center space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {question.task === 'read_word' ? 'READ THE WORD' : 'NAME THE COLOR'}
                </div>
                
                <div className="py-12">
                  <div 
                    className="text-6xl font-bold"
                    style={{ color: COLOR_MAP[question.color.toLowerCase()] || question.color }}
                  >
                    {question.word}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg capitalize"
                  >
                    {option}
                  </Button>
                ))}
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
          <ScoreDisplay result={result} gameType="stroop_test" />
        </div>
      </div>
    );
  }

  return null;
};

export default StroopTestStandard;
