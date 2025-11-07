import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Play, Home } from 'lucide-react';
import { ProgressBar } from '@/components/game/ProgressBar';
import { Timer } from '@/components/game/Timer';
import { useNavigate } from 'react-router-dom';
import { INTERVIEW_QUESTIONS } from '@/data/interviewQuestions';

const QUESTIONS = INTERVIEW_QUESTIONS.map(q => ({
  id: q.id,
  question: q.text,
  competency: q.competency
}));

const GEMINI_API_KEY = 'AIzaSyDQNjMZ6VfloVvjGq02AKq9TRN6CxAy0ZU';
const TIME_PER_QUESTION = 120; // 2 minutes

type GameState = 'welcome' | 'playing' | 'results';

interface Response {
  questionId: number;
  answer: string;
  timeTaken: number;
  score?: number;
  feedback?: string;
}

const Interview = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isScoring, setIsScoring] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setCurrentAnswer('');
    setResponses([]);
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;

    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const response: Response = {
      questionId: currentQuestionIndex + 1,
      answer: currentAnswer,
      timeTaken,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
      setIsTimerRunning(false);
      setTimeout(() => setIsTimerRunning(true), 100);
    } else {
      setIsTimerRunning(false);
      scoreAllResponses(newResponses);
    }
  };

  const handleTimeout = () => {
    handleSubmitAnswer();
  };

  const scoreAllResponses = async (allResponses: Response[]) => {
    setGameState('results');
    setIsScoring(true);

    const scoredResponses = await Promise.all(
      allResponses.map(async (response, index) => {
        try {
          const result = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Score this interview response on a scale of 0-10 and provide constructive feedback.
Question: ${QUESTIONS[index].question}
Response: ${response.answer}

Evaluate based on:
- Relevance and directness
- Clarity and structure
- Depth and specific examples
- Professionalism

Return ONLY valid JSON: {"score": X, "feedback": "..."}`
                  }]
                }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 500
                }
              })
            }
          );

          const data = await result.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"score": 5, "feedback": "Unable to score"}';
          
          const jsonMatch = text.match(/\{[^}]+\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 5, feedback: "Unable to score" };

          return {
            ...response,
            score: parsed.score,
            feedback: parsed.feedback
          };
        } catch (error) {
          console.error('Scoring error:', error);
          return {
            ...response,
            score: 5,
            feedback: "Unable to score this response."
          };
        }
      })
    );

    const avgScore = scoredResponses.reduce((sum, r) => sum + (r.score || 0), 0) / scoredResponses.length;
    setResponses(scoredResponses);
    setOverallScore(avgScore);
    setIsScoring(false);

    // Save to database
    try {
      const { submitGameResult } = await import('@/lib/supabase');
      await submitGameResult('scenario_challenge', scoredResponses, {
        gameId: 'interview',
        gameName: 'Interview Assessment',
        timestamp: new Date(),
        finalScore: avgScore * 10,
        competencies: [],
        rawData: { responses: scoredResponses }
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  if (gameState === 'welcome') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="w-6 h-6 text-primary" />
                Interview Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  Answer 5 interview questions honestly. You'll get a score and detailed AI feedback at the end.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Read each question and type your answer</li>
                  <li>You have 2 minutes per question</li>
                  <li>Click "Next Question" to submit and continue</li>
                  <li>You can submit early if you finish before time runs out</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 5 interview questions</li>
                  <li>• 2 minutes per question</li>
                  <li>• AI-powered evaluation</li>
                  <li>• Measures communication, problem-solving, and self-awareness</li>
                </ul>
              </div>
              <Button onClick={startGame} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentQuestion = QUESTIONS[currentQuestionIndex];

    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Question {currentQuestionIndex + 1} of {QUESTIONS.length}
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
              <ProgressBar current={currentQuestionIndex + 1} total={QUESTIONS.length} />
              
              <div className="bg-primary/5 p-6 rounded-lg">
                <p className="text-lg font-medium">{currentQuestion.question}</p>
                <p className="text-sm text-muted-foreground mt-2">Competency: {currentQuestion.competency}</p>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={10}
                  className="text-base"
                  autoFocus
                />
                <Button 
                  onClick={handleSubmitAnswer} 
                  className="w-full" 
                  size="lg"
                  disabled={!currentAnswer.trim()}
                >
                  {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question' : 'Finish Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Assessment Complete!</h1>
              {isScoring ? (
                <p className="text-lg text-muted-foreground">Scoring your responses...</p>
              ) : (
                <div>
                  <p className="text-5xl font-bold text-primary mb-2">
                    {overallScore.toFixed(1)}/10
                  </p>
                  <p className="text-muted-foreground">Overall Score</p>
                </div>
              )}
            </div>

            {!isScoring && (
              <div className="space-y-6 mb-8">
                {responses.map((response, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground">{QUESTIONS[index].competency}</p>
                      </div>
                      <div className="text-3xl font-bold text-primary">{response.score}/10</div>
                    </div>
                    
                    <p className="text-sm mb-4 p-4 bg-muted rounded">{QUESTIONS[index].question}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Your Answer:</p>
                      <p className="text-sm p-4 bg-secondary/50 rounded">{response.answer}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold mb-2">AI Feedback:</p>
                      <p className="text-sm text-muted-foreground">{response.feedback}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Retake Assessment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Interview;
