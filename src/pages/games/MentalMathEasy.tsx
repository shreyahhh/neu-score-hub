"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { useScoringConfig } from '@/context/ScoringConfigContext';
import { calculateMentalMathScore } from '@/lib/scoring';
import { saveGameResult } from '@/lib/supabase';
import { toast } from 'sonner';
import { Calculator, Play, CheckCircle } from 'lucide-react';

interface Question {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*';
  correctAnswer: number;
}

const MentalMathEasy = () => {
  const { config } = useScoringConfig();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<{ correct: boolean; time: number }[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [result, setResult] = useState<any>(null);

  const TOTAL_QUESTIONS = 10;
  const MAX_TIME = 180; // 3 minutes

  // Generate random question
  const generateQuestion = (): Question => {
    const operators: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1, num2, correctAnswer;
    
    if (operator === '*') {
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      correctAnswer = num1 * num2;
    } else if (operator === '+') {
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 50) + 10;
      correctAnswer = num1 + num2;
    } else {
      num2 = Math.floor(Math.random() * 30) + 10;
      correctAnswer = Math.floor(Math.random() * 50) + 10;
      num1 = correctAnswer + num2;
    }

    return { num1, num2, operator, correctAnswer };
  };

  const startGame = () => {
    const newQuestions = Array.from({ length: TOTAL_QUESTIONS }, () => generateQuestion());
    setQuestions(newQuestions);
    setGameState('playing');
    setCurrentQuestion(0);
    setAnswers([]);
    setUserAnswer('');
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) return;

    const currentQ = questions[currentQuestion];
    const isCorrect = parseInt(userAnswer) === currentQ.correctAnswer;
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    const newAnswers = [...answers, { correct: isCorrect, time: timeSpent }];
    setAnswers(newAnswers);

    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      finishGame(newAnswers);
    }
  };

  const finishGame = async (finalAnswers: { correct: boolean; time: number }[]) => {
    setGameState('finished');
    
    const totalTime = (Date.now() - startTime) / 1000;
    const correct = finalAnswers.filter(a => a.correct).length;
    const percentError = ((TOTAL_QUESTIONS - correct) / TOTAL_QUESTIONS) * 100;

    const gameResult = calculateMentalMathScore(config.mentalMath, {
      correct,
      total: TOTAL_QUESTIONS,
      percentError,
      timeTaken: totalTime,
      maxTime: MAX_TIME,
      numOperations: TOTAL_QUESTIONS,
    });

    setResult(gameResult);

    // Save to database
    try {
      await saveGameResult('mental-math-easy', gameResult);
      toast.success('Game result saved successfully!');
    } catch (error) {
      toast.error('Failed to save game result');
      console.error(error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      submitAnswer();
    }
  };

  if (gameState === 'finished' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              onClick={() => setGameState('ready')}
              variant="outline"
            >
              ← Back to Start
            </Button>
          </div>
          <ScoreDisplay result={result} />
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && questions.length > 0) {
    const currentQ = questions[currentQuestion];
    
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Mental Math Sprint
                </CardTitle>
                <Timer isRunning={true} maxTime={MAX_TIME} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar
                current={currentQuestion + 1}
                total={TOTAL_QUESTIONS}
                label="Progress"
              />

              <div className="text-center py-12">
                <div className="text-6xl font-bold text-primary mb-8">
                  {currentQ.num1} {currentQ.operator} {currentQ.num2} = ?
                </div>

                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your answer"
                  className="text-4xl text-center p-4 border-2 border-primary rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={submitAnswer}
                  size="lg"
                  disabled={!userAnswer.trim()}
                  className="w-48"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Answer
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Press Enter to submit
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="space-y-4">
              <p className="text-lg">
                Test your mental arithmetic skills with {TOTAL_QUESTIONS} quick calculations.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Game Rules:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Answer {TOTAL_QUESTIONS} math questions as quickly as possible</li>
                  <li>Questions include addition, subtraction, and multiplication</li>
                  <li>You have {MAX_TIME / 60} minutes total</li>
                  <li>Type your answer and press Enter or click Submit</li>
                </ul>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-primary">Competencies Tested:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Accuracy:</strong> How many answers you get correct</li>
                  <li><strong>Speed:</strong> How quickly you complete the test</li>
                  <li><strong>Quantitative Aptitude:</strong> Combined accuracy and speed</li>
                  <li><strong>Mental Stamina:</strong> Sustained performance throughout</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={startGame} size="lg" className="w-48">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentalMathEasy;
