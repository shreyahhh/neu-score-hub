import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Play } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitGame } from '@/lib/api';

// Question pool (30 questions)
const QUESTION_POOL = [
  { id: 1, word: 'RED', color: '#FF0000', task: 'name_color', correct: 'RED', options: ['RED', 'BLUE'] },
  { id: 2, word: 'BLUE', color: '#0000FF', task: 'read_word', correct: 'BLUE', options: ['BLUE', 'GREEN'] },
  { id: 3, word: 'GREEN', color: '#00FF00', task: 'name_color', correct: 'GREEN', options: ['GREEN', 'ORANGE'] },
  { id: 4, word: 'RED', color: '#0000FF', task: 'name_color', correct: 'BLUE', options: ['RED', 'BLUE'], interference: true },
  { id: 5, word: 'ORANGE', color: '#FFA500', task: 'read_word', correct: 'ORANGE', options: ['ORANGE', 'PURPLE'] },
  { id: 6, word: 'BLUE', color: '#FF0000', task: 'name_color', correct: 'RED', options: ['BLUE', 'RED'], interference: true },
  { id: 7, word: 'PURPLE', color: '#800080', task: 'name_color', correct: 'PURPLE', options: ['PURPLE', 'BROWN'] },
  { id: 8, word: 'GREEN', color: '#FFA500', task: 'name_color', correct: 'ORANGE', options: ['GREEN', 'ORANGE'], interference: true },
  { id: 9, word: 'BROWN', color: '#8B4513', task: 'read_word', correct: 'BROWN', options: ['BROWN', 'GRAY'] },
  { id: 10, word: 'GRAY', color: '#808080', task: 'name_color', correct: 'GRAY', options: ['GRAY', 'RED'] },
  { id: 11, word: 'RED', color: '#00FF00', task: 'name_color', correct: 'GREEN', options: ['RED', 'GREEN'], interference: true },
  { id: 12, word: 'BLUE', color: '#800080', task: 'name_color', correct: 'PURPLE', options: ['BLUE', 'PURPLE'], interference: true },
  { id: 13, word: 'ORANGE', color: '#FF0000', task: 'name_color', correct: 'RED', options: ['ORANGE', 'RED'], interference: true },
  { id: 14, word: 'GREEN', color: '#00FF00', task: 'read_word', correct: 'GREEN', options: ['GREEN', 'BLUE'] },
  { id: 15, word: 'PURPLE', color: '#0000FF', task: 'name_color', correct: 'BLUE', options: ['PURPLE', 'BLUE'], interference: true },
  { id: 16, word: 'BROWN', color: '#8B4513', task: 'name_color', correct: 'BROWN', options: ['BROWN', 'ORANGE'] },
  { id: 17, word: 'GRAY', color: '#00FF00', task: 'name_color', correct: 'GREEN', options: ['GRAY', 'GREEN'], interference: true },
  { id: 18, word: 'RED', color: '#FF0000', task: 'read_word', correct: 'RED', options: ['RED', 'PURPLE'] },
  { id: 19, word: 'BLUE', color: '#FFA500', task: 'name_color', correct: 'ORANGE', options: ['BLUE', 'ORANGE'], interference: true },
  { id: 20, word: 'GREEN', color: '#800080', task: 'name_color', correct: 'PURPLE', options: ['GREEN', 'PURPLE'], interference: true },
  { id: 21, word: 'ORANGE', color: '#FFA500', task: 'name_color', correct: 'ORANGE', options: ['ORANGE', 'RED'] },
  { id: 22, word: 'PURPLE', color: '#800080', task: 'read_word', correct: 'PURPLE', options: ['PURPLE', 'GRAY'] },
  { id: 23, word: 'BROWN', color: '#0000FF', task: 'name_color', correct: 'BLUE', options: ['BROWN', 'BLUE'], interference: true },
  { id: 24, word: 'GRAY', color: '#808080', task: 'read_word', correct: 'GRAY', options: ['GRAY', 'BROWN'] },
  { id: 25, word: 'RED', color: '#800080', task: 'name_color', correct: 'PURPLE', options: ['RED', 'PURPLE'], interference: true },
  { id: 26, word: 'BLUE', color: '#0000FF', task: 'name_color', correct: 'BLUE', options: ['BLUE', 'GREEN'] },
  { id: 27, word: 'GREEN', color: '#FF0000', task: 'name_color', correct: 'RED', options: ['GREEN', 'RED'], interference: true },
  { id: 28, word: 'ORANGE', color: '#00FF00', task: 'name_color', correct: 'GREEN', options: ['ORANGE', 'GREEN'], interference: true },
  { id: 29, word: 'PURPLE', color: '#FFA500', task: 'name_color', correct: 'ORANGE', options: ['PURPLE', 'ORANGE'], interference: true },
  { id: 30, word: 'BROWN', color: '#8B4513', task: 'name_color', correct: 'BROWN', options: ['BROWN', 'GRAY'] },
];

type GameState = 'instructions' | 'playing' | 'results';

const StroopTestStandard = () => {
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [selectedQuestions, setSelectedQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timePerQuestion = 3; // 3 seconds per question

  const startGame = () => {
    // Randomly select 10 questions from pool
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    setSelectedQuestions(selected);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setGameState('playing');
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleAnswer = (answer: string) => {
    const question = selectedQuestions[currentQuestionIndex];
    const responseTime = Date.now() - questionStartTime;
    const isCorrect = answer === question.correct;

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

    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else {
      finishGame(newResponses);
    }
  };

  const handleTimeout = () => {
    const question = selectedQuestions[currentQuestionIndex];
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

    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setIsTimerRunning(false);
      setTimeout(() => setIsTimerRunning(true), 100);
    } else {
      finishGame(newResponses);
    }
  };

  const finishGame = async (finalResponses: any[]) => {
    setIsTimerRunning(false);
    
    try {
      // Submit to backend for scoring
      const result = await submitGame('stroop_test', finalResponses);
      
      // Backend returns the full game result with scores
      setResult(result);
      setGameState('results');
    } catch (error) {
      console.error('Error submitting game:', error);
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
                  <li>• 10 questions</li>
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
    const question = selectedQuestions[currentQuestionIndex];
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Stroop Test
                </CardTitle>
                <Timer
                  isRunning={isTimerRunning}
                  initialTime={timePerQuestion}
                  countDown
                  maxTime={timePerQuestion}
                  onComplete={handleTimeout}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar current={currentQuestionIndex + 1} total={selectedQuestions.length} />
              
              <div className="text-center space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {question.task === 'read_word' ? 'READ THE WORD' : 'NAME THE COLOR'}
                </div>
                
                <div className="py-12">
                  <div 
                    className="text-6xl font-bold"
                    style={{ color: question.color }}
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
                    className="h-16 text-lg"
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
          <ScoreDisplay result={result} />
        </div>
      </div>
    );
  }

  return null;
};

export default StroopTestStandard;
