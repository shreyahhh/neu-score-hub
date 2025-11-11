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
const DEFAULT_TIME_PER_QUESTION = 300; // 5 minutes per question

interface InterviewQuestion {
  id: string;
  question: string;
  time_limit?: number;
}

const Interview = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [contentId, setContentId] = useState<string | null>(null); // Track which content was used
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [allResponses, setAllResponses] = useState<any[]>([]); // Store all responses
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<GameResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0); // Track start time for each question
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Control timer
  const [gameStarted, setGameStarted] = useState(false); // Track if game has started
  const [timePerQuestion, setTimePerQuestion] = useState(DEFAULT_TIME_PER_QUESTION);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const contentData = await getGameContent(GAME_TYPE);
        console.log('Fetched interview content from database:', contentData);
        
        // Extract questions from content data
        if (contentData?.questions && Array.isArray(contentData.questions)) {
          const fetchedQuestions = contentData.questions.map((q: any) => ({
            id: q.id || `q${Math.random()}`,
            question: q.question || q.text || q,
            time_limit: q.time_limit || DEFAULT_TIME_PER_QUESTION
          }));
          
          setQuestions(fetchedQuestions);
          
          // Set time limit from first question if available
          if (fetchedQuestions.length > 0 && fetchedQuestions[0].time_limit) {
            setTimePerQuestion(fetchedQuestions[0].time_limit);
          }
        } else {
          throw new Error('Invalid questions data from database');
        }
        
        // Store content_id for submission
        if (contentData?.content_id) {
          setContentId(contentData.content_id);
        }
      } catch (error) {
        console.error("Failed to load interview questions:", error);
        // Fallback questions
        setQuestions([
          { id: 'q1', question: 'Tell me about a time you failed and what you learned from it.', time_limit: DEFAULT_TIME_PER_QUESTION },
          { id: 'q2', question: 'Describe a situation where you had to motivate a team. What was the outcome?', time_limit: DEFAULT_TIME_PER_QUESTION },
          { id: 'q3', question: 'How do you handle constructive criticism?', time_limit: DEFAULT_TIME_PER_QUESTION },
          { id: 'q4', question: 'Walk me through a complex problem you solved. What was your process?', time_limit: DEFAULT_TIME_PER_QUESTION },
        ]);
        setContentId('fallback-interview-1');
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
    if (!user || questions.length === 0) return;

    setSubmitting(true);
    try {
      const question = questions[currentQuestionIndex];
      const timeTaken = (Date.now() - questionStartTime) / 1000; // Calculate time taken

      const responseData = {
        question_id: question.id,
        question_text: question.question,
        response_text: currentAnswer,
        time_taken: timeTaken
      };

      // Store response for final submission
      const updatedResponses = [...allResponses, responseData];
      setAllResponses(updatedResponses);
      
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
        setSubmitting(false);
      } else {
        // Last question - submit all responses together
        setIsTimerRunning(false);
        await submitAllResponses(updatedResponses);
      }
    } catch (error) {
      console.error("Error submitting interview answer:", error);
      alert("Failed to submit answer. Please try again.");
      setSubmitting(false);
    }
  };

  // Submit all responses at once
  const submitAllResponses = async (responses: any[]) => {
    try {
      // Prepare response data in the format backend expects
      const responseData = {
        responses: responses.map(r => ({
          question_id: r.question_id,
          question_text: r.question_text,
          response_text: r.response_text,
          time_taken: r.time_taken
        }))
      };
      
      console.log('Submitting interview with data:', { gameType: GAME_TYPE, responseData, contentId });
      // Submit with content_id to track which questions were used
      const result = await submitAIGame(
        GAME_TYPE, 
        responseData, 
        user?.id,
        contentId || undefined
      );

      console.log('Interview result from backend:', result);

      // Backend returns { session_id, version_used, ai_scores, final_scores } for AI games
      if (result && (result.final_scores || result.scores || result.session_id)) {
        setFinalScore(result);
        setIsFinished(true);
      } else {
        console.error('Invalid result from backend - missing scores or session_id:', result);
        throw new Error(`Invalid response from backend. Expected scores or session_id, got: ${JSON.stringify(result)}`);
      }
    } catch (error: any) {
      console.error("Error submitting all responses:", error);
      const errorMessage = error?.message || 'Unknown error';
      console.error('Error details:', { error, message: errorMessage, stack: error?.stack });
      alert(`Failed to submit game: ${errorMessage}. Check console for details.`);
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
        question_id: question.id,
        question_text: question.question,
        response_text: '', // Empty response for timeout
        time_taken: timePerQuestion // Max time taken for timeout
      };

      // Store timeout response
      const updatedResponses = [...allResponses, responseData];
      setAllResponses(updatedResponses);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
        setQuestionStartTime(Date.now()); // Reset timer for next question
        setIsTimerRunning(true); // Restart timer
        setSubmitting(false);
      } else {
        // Last question - submit all responses together
        setIsTimerRunning(false);
        await submitAllResponses(updatedResponses);
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
    return <ScoreDisplay result={finalScore} gameType={GAME_TYPE} />;
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
                  <li>• {timePerQuestion / 60} minutes per question</li>
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
                        initialTime={timePerQuestion}
                        countDown
                        maxTime={timePerQuestion}
            onComplete={handleTimeout}
          />
        </div>
        <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </CardHeader>
      <CardContent>
        {questions.length > 0 && (
          <div className="space-y-4">
            <p className="font-semibold">{questions[currentQuestionIndex].question}</p>
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