import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Clock, Sparkles, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QUESTIONS = [
  { id: 1, object: 'Brick', question: 'How many possible uses can you think of for a brick?' },
  { id: 2, object: 'Paperclip', question: 'How many possible uses can you think of for a paperclip?' },
  { id: 3, object: 'Plastic Bottle', question: 'How many possible uses can you think of for a plastic bottle?' }
];

const TIME_LIMIT = 60; // seconds per question
const GEMINI_API_KEY = 'AIzaSyDQNjMZ6VfloVvjGq02AKq9TRN6CxAy0ZU';

type GamePhase = 'welcome' | 'playing' | 'results';

interface QuestionResponse {
  questionId: number;
  object: string;
  answer: string;
  timeSpent: number;
}

interface QuestionScore {
  object: string;
  usesCount: number;
  innovationScore: number;
  score: number;
}

interface GameResults {
  questionScores: QuestionScore[];
  overallScore: number;
  totalUses: number;
  avgInnovation: number;
}

const CreativeUses = () => {
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [results, setResults] = useState<GameResults | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const { toast } = useToast();

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitAnswer();
          return TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentQuestionIndex]);

  const handleStart = () => {
    setPhase('playing');
    setCurrentQuestionIndex(0);
    setTimeLeft(TIME_LIMIT);
    setCurrentAnswer('');
    setResponses([]);
    setResults(null);
  };

  const handleSubmitAnswer = async () => {
    const timeSpent = TIME_LIMIT - timeLeft;
    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id,
      object: currentQuestion.object,
      answer: currentAnswer.trim(),
      timeSpent
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setTimeLeft(TIME_LIMIT);
    } else {
      // All questions completed, score with AI
      setIsScoring(true);
      await scoreWithGemini(updatedResponses);
    }
  };

  const scoreWithGemini = async (allResponses: QuestionResponse[]) => {
    try {
      const prompt = `You are evaluating creative thinking responses. For each object below, the user provided creative uses. Score each response based on:
1. Number of valid, unique uses (count them)
2. Innovation score (0-100) based on creativity, originality, category diversity, and detail

Objects and responses:
${allResponses.map(r => `\nObject: ${r.object}\nUses listed: ${r.answer}`).join('\n')}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "object": "Brick",
    "usesCount": 5,
    "innovationScore": 75
  },
  {
    "object": "Paperclip",
    "usesCount": 7,
    "innovationScore": 82
  },
  {
    "object": "Plastic Bottle",
    "usesCount": 6,
    "innovationScore": 68
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000
            }
          })
        }
      );

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid AI response format');
      
      const questionScores: QuestionScore[] = JSON.parse(jsonMatch[0]).map((qs: any) => ({
        ...qs,
        score: Math.round((qs.usesCount * 5 + qs.innovationScore) / 2)
      }));

      const overallScore = Math.round(
        questionScores.reduce((sum, qs) => sum + qs.score, 0) / questionScores.length
      );

      const totalUses = questionScores.reduce((sum, qs) => sum + qs.usesCount, 0);
      const avgInnovation = Math.round(
        questionScores.reduce((sum, qs) => sum + qs.innovationScore, 0) / questionScores.length
      );

      setResults({
        questionScores,
        overallScore,
        totalUses,
        avgInnovation
      });

      setPhase('results');
      setIsScoring(false);
    } catch (error) {
      console.error('Scoring error:', error);
      toast({
        title: 'Scoring Error',
        description: 'Failed to score responses. Please try again.',
        variant: 'destructive'
      });
      setIsScoring(false);
    }
  };

  const getTimerColor = () => {
    if (timeLeft > 30) return 'text-green-500';
    if (timeLeft > 10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-500' };
    if (score >= 60) return { text: 'Good', color: 'text-blue-500' };
    if (score >= 40) return { text: 'Fair', color: 'text-yellow-500' };
    return { text: 'Average', color: 'text-orange-500' };
  };

  if (phase === 'welcome') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Lightbulb className="w-8 h-8 text-primary" />
                Creative Uses Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Test your creativity by thinking of innovative uses for everyday objects!
              </p>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">How It Works:</h3>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Answer 3 creative thinking challenges</li>
                  <li>Each challenge has a 60-second time limit</li>
                  <li>List as many creative uses as possible (one per line)</li>
                  <li>Get scored on number and innovation of ideas</li>
                </ol>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                {QUESTIONS.map((q) => (
                  <div key={q.id} className="bg-card border rounded-lg p-4">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{q.object}</p>
                  </div>
                ))}
              </div>

              <Button onClick={handleStart} size="lg" className="w-full">
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</CardTitle>
                <div className={`flex items-center gap-2 ${getTimerColor()} font-bold text-xl`}>
                  <Clock className="w-5 h-5" />
                  {timeLeft}s
                </div>
              </div>
              <Progress value={(currentQuestionIndex / QUESTIONS.length) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">{currentQuestion.object}</h2>
                <p className="text-lg text-muted-foreground">{currentQuestion.question}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Creative Uses (one per line):
                </label>
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Example:&#10;Use as a doorstop&#10;Use as a bookend&#10;Use as a building block&#10;..."
                  className="min-h-[200px] font-mono"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {currentAnswer.split('\n').filter(line => line.trim()).length} uses listed
                </p>
              </div>

              <Button
                onClick={handleSubmitAnswer}
                size="lg"
                className="w-full"
                disabled={!currentAnswer.trim()}
              >
                {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question' : 'Finish Challenge'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'results' && results) {
    const badge = getPerformanceBadge(results.overallScore);
    
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Trophy className="w-8 h-8 text-primary" />
                Challenge Completed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-8">
                <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                <p className="text-6xl font-bold mb-2">{results.overallScore}</p>
                <p className={`text-xl font-semibold ${badge.color}`}>{badge.text}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{results.totalUses}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{results.avgInnovation}</p>
                  <p className="text-sm text-muted-foreground">Avg Innovation</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{QUESTIONS.length}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Individual Scores:</h3>
                {results.questionScores.map((qs, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{qs.object}</p>
                      <p className="text-2xl font-bold">{qs.score}/100</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Uses: </span>
                        <span className="font-medium">{qs.usesCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Innovation: </span>
                        <span className="font-medium">{qs.innovationScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleStart} size="lg" className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isScoring) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">Scoring Your Creativity...</h2>
              <p className="text-muted-foreground">AI is analyzing your responses</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default CreativeUses;
