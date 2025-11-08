import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { submitAIGame, getGameContent } from '../../lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';

const GAME_TYPE = 'interview';
// Per prompt, AI games should use 'scenario_challenge' type for submission
const SUBMISSION_GAME_TYPE = 'scenario_challenge';

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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await getGameContent(GAME_TYPE);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Failed to load interview questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleSubmitAnswer = async () => {
    if (!user || !currentAnswer.trim()) return;

    setSubmitting(true);
    try {
      const question = questions[currentQuestionIndex];
      const responseData = {
        scenario_text: "Interview Question", // Using placeholder as per prompt
        question_text: question.text,
        response_text: currentAnswer,
        response_length: currentAnswer.length,
      };

      // Submit each answer and get a score
      const result = await submitAIGame(SUBMISSION_GAME_TYPE, responseData, user.id);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
      } else {
        setFinalScore(result); // Set the final score from the last submission
        setIsFinished(true);
      }
    } catch (error) {
      console.error("Error submitting interview answer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isFinished && finalScore) {
    return <ScoreDisplay result={finalScore} />;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Interview Challenge</CardTitle>
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
  );
};

export default Interview;