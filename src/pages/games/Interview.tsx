import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Timer } from '@/components/game/Timer';
import { ProgressBar } from '@/components/game/ProgressBar';
import { Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
  {
    id: 1,
    text: "Describe a challenging project you worked on. How did you handle obstacles?",
    competency: "Problem Solving"
  },
  {
    id: 2,
    text: "How do you prioritize tasks when managing multiple deadlines?",
    competency: "Time Management"
  },
  {
    id: 3,
    text: "Tell me about a time you had to communicate a complex idea to a non-technical audience.",
    competency: "Communication"
  },
  {
    id: 4,
    text: "Describe a situation where you had to work with a difficult team member.",
    competency: "Collaboration"
  },
  {
    id: 5,
    text: "What's your approach to learning new skills or technologies?",
    competency: "Learning Agility"
  }
];

const GEMINI_API_KEY = 'AIzaSyDQNjMZ6VfloVvjGq02AKq9TRN6CxAy0ZU';

type Phase = 'thinking' | 'writing' | 'review';
type GameState = 'welcome' | 'playing' | 'results';

interface Response {
  questionId: number;
  answer: string;
  score?: number;
  feedback?: string;
}

export default function Interview() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<Phase>('thinking');
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [isScoring, setIsScoring] = useState(false);

  const PHASE_TIMES = {
    thinking: 30,
    writing: 120,
    review: 60
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, phase, currentQuestion]);

  const handlePhaseComplete = () => {
    if (phase === 'thinking') {
      setPhase('writing');
      setTimeLeft(PHASE_TIMES.writing);
    } else if (phase === 'writing') {
      setPhase('review');
      setTimeLeft(PHASE_TIMES.review);
    } else {
      handleSubmitAnswer();
    }
  };

  const handleSubmitAnswer = () => {
    const newResponse: Response = {
      questionId: QUESTIONS[currentQuestion].id,
      answer: currentAnswer
    };
    
    setResponses([...responses, newResponse]);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setPhase('thinking');
      setTimeLeft(PHASE_TIMES.thinking);
      setCurrentAnswer('');
    } else {
      scoreAllResponses([...responses, newResponse]);
    }
  };

  const scoreAllResponses = async (allResponses: Response[]) => {
    setGameState('results');
    setIsScoring(true);

    const scoredResponses = await Promise.all(
      allResponses.map(async (response, index) => {
        try {
          const result = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Score this interview response on a scale of 0-10 and provide feedback.
Question: ${QUESTIONS[index].text}
Response: ${response.answer}

Evaluate based on:
- Relevance to the question
- Clarity and structure
- Depth of thinking
- Specific examples/details
- Professionalism

Return ONLY valid JSON in this exact format: {"score": X, "feedback": "..."}`
                  }]
                }]
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

    setResponses(scoredResponses);
    setIsScoring(false);
  };

  const getPhaseLabel = () => {
    if (phase === 'thinking') return 'Thinking Phase';
    if (phase === 'writing') return 'Writing Phase';
    return 'Review Phase';
  };

  const averageScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length;

  if (gameState === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <h1 className="text-4xl font-bold mb-4 text-center">Interview Assessment</h1>
          <p className="text-lg text-muted-foreground mb-6 text-center">
            Answer 5 interview questions honestly. You'll get a score and detailed AI feedback at the end.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Thinking Phase (30s)</h3>
                <p className="text-sm text-muted-foreground">Read and understand the question</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Writing Phase (120s)</h3>
                <p className="text-sm text-muted-foreground">Type your answer</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Review Phase (60s)</h3>
                <p className="text-sm text-muted-foreground">Edit and refine your response</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => {
              setGameState('playing');
              setTimeLeft(PHASE_TIMES.thinking);
            }} 
            className="w-full"
            size="lg"
          >
            Start Assessment
          </Button>
        </Card>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="mb-6">
            <ProgressBar
              current={currentQuestion + 1}
              total={QUESTIONS.length}
              label={`Question ${currentQuestion + 1} of ${QUESTIONS.length}`}
            />
          </div>

          <Card className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{getPhaseLabel()}</h2>
                <p className="text-sm text-muted-foreground">{QUESTIONS[currentQuestion].competency}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
              </div>
            </div>

            <div className="mb-6 p-6 bg-muted rounded-lg">
              <p className="text-lg">{QUESTIONS[currentQuestion].text}</p>
            </div>

            {phase !== 'thinking' && (
              <div className="space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[300px] text-base"
                  readOnly={phase === 'review'}
                />
                
                {phase === 'review' && (
                  <Button onClick={handleSubmitAnswer} className="w-full" size="lg">
                    {currentQuestion < QUESTIONS.length - 1 ? 'Next Question' : 'Complete Assessment'}
                  </Button>
                )}
              </div>
            )}

            {phase === 'thinking' && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Read the question carefully and prepare your response...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="p-8 mb-6">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-2">Assessment Complete</h1>
            {isScoring ? (
              <p className="text-lg text-muted-foreground">Scoring your responses...</p>
            ) : (
              <div>
                <p className="text-3xl font-bold text-primary mb-2">
                  {averageScore.toFixed(1)}/10
                </p>
                <p className="text-muted-foreground">Overall Score</p>
              </div>
            )}
          </div>

          {!isScoring && (
            <div className="space-y-6">
              {responses.map((response, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">Question {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">{QUESTIONS[index].competency}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{response.score}/10</div>
                  </div>
                  
                  <p className="text-sm mb-4 p-4 bg-muted rounded">{QUESTIONS[index].text}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Your Answer:</p>
                    <p className="text-sm p-4 bg-secondary rounded">{response.answer}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold mb-2">AI Feedback:</p>
                    <p className="text-sm text-muted-foreground">{response.feedback}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
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
