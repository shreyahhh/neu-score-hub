import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Play } from 'lucide-react';
import { ProgressBar } from '@/components/game/ProgressBar';
import { Timer } from '@/components/game/Timer';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitAIGame } from '@/lib/api';
import { SCENARIOS } from '@/data/scenarioQuestions';

const TIME_PER_QUESTION = 60; // 1 minute

type GameState = 'instructions' | 'playing' | 'results';

const ScenarioChallenge = () => {
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [currentScenario] = useState(SCENARIOS[0]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setCurrentAnswer('');
    setResponses([]);
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleSubmitResponse = async () => {
    if (!currentAnswer.trim()) return;

    const question = currentScenario.questions[currentQuestion];
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    const response = {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      answer: currentAnswer,
      timeTaken,
      wordCount: currentAnswer.split(' ').length,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestion < currentScenario.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
      setIsTimerRunning(false);
      setTimeout(() => setIsTimerRunning(true), 100);
    } else {
      setIsTimerRunning(false);
      await finishGame(newResponses);
    }
  };

  const handleTimeout = () => {
    handleSubmitResponse();
  };

  const finishGame = async (finalResponses: any[]) => {
    setIsTimerRunning(false);
    
    try {
      // Submit to backend for AI scoring
      const result = await submitAIGame('scenario_challenge', finalResponses);
      
      // Backend returns the full game result with scores
      setResult(result);
      setGameState('results');
    } catch (error) {
      console.error('Error finishing game:', error);
    }
  };

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="w-6 h-6 text-primary" />
                Scenario Challenge (AI)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  You will be presented with a workplace scenario and 4 questions.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Read the scenario carefully</li>
                  <li>Type your answer to each question</li>
                  <li>You have 1 minute per question</li>
                  <li>Click "Next Question" to submit and continue</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 1 scenario with 4 questions</li>
                  <li>• 1 minute per question</li>
                  <li>• Text input only</li>
                  <li>• Measures reasoning, empathy, creativity, and communication</li>
                </ul>
              </div>
              <Button onClick={startGame} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  if (gameState === 'playing') {
    const question = currentScenario.questions[currentQuestion];
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Scenario (always visible) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-bold mb-2">{currentScenario.title}</h3>
                  <p className="text-sm">{currentScenario.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Right: Question and Response */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Question {currentQuestion + 1} of {currentScenario.questions.length}
                  </CardTitle>
                  <Timer
                    isRunning={isTimerRunning}
                    initialTime={TIME_PER_QUESTION}
                    countDown
                    maxTime={TIME_PER_QUESTION}
                    onComplete={handleTimeout}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressBar current={currentQuestion + 1} total={currentScenario.questions.length} />
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-medium">{question.text}</p>
                </div>

                <div className="space-y-4">
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    rows={8}
                    autoFocus
                  />
                  <Button 
                    onClick={handleSubmitResponse} 
                    className="w-full" 
                    size="lg" 
                    disabled={!currentAnswer.trim()}
                  >
                    {currentQuestion < currentScenario.questions.length - 1 ? 'Next Question' : 'Finish Challenge'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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

export default ScenarioChallenge;
