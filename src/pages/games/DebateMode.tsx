import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Play, Home, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Timer } from '@/components/game/Timer';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { submitAIGame, getGameContent, DEFAULT_USER_ID } from '@/lib/api';
import { GameResult } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

type GameState = 'instructions' | 'statementDisplay' | 'prosWriting' | 'consWriting' | 'completing' | 'results';

const GAME_TYPE = 'ai_debate';
const TIME_PER_ARGUMENT = 90; // 90 seconds per argument
const STATEMENT_DISPLAY_TIME = 5; // 5 seconds to display statement

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DebateMode = () => {
  const navigate = useNavigate();
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [debateTopic, setDebateTopic] = useState<string>('');
  const [prosArgument, setProsArgument] = useState<string>('');
  const [consArgument, setConsArgument] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null); // Track loading errors
  
  // Timer States
  const [prosStartTime, setProsStartTime] = useState<number>(0);
  const [consStartTime, setConsStartTime] = useState<number>(0);
  const [isProsTimerRunning, setIsProsTimerRunning] = useState(false);
  const [isConsTimerRunning, setIsConsTimerRunning] = useState(false);
  const [statementCountdown, setStatementCountdown] = useState(STATEMENT_DISPLAY_TIME);
  const [prosTimeTaken, setProsTimeTaken] = useState<number>(0);
  const [consTimeTaken, setConsTimeTaken] = useState<number>(0);

  const [contentId, setContentId] = useState<string | null>(null); // Track which content was used

  // ============================================================================
  // LOAD DEBATE TOPIC
  // ============================================================================

  useEffect(() => {
    const fetchDebateTopic = async () => {
      try {
        setLoading(true);
        // Fetch random debate topic from database via /api/content/ai_debate
        const contentData = await getGameContent(GAME_TYPE);
        console.log('Fetched debate content from database:', contentData);
        
        // Extract statement/topic from content data
        const statement = contentData?.statement || 
                         contentData?.topic || 
                         contentData?.debate_statement ||
                         "Artificial intelligence will create more jobs than it eliminates";
        
        setDebateTopic(statement);
        
        // Store content_id for submission
        if (contentData?.content_id) {
          setContentId(contentData.content_id);
        }
        
        // Update time limits if provided in content
        if (contentData?.time_limit_pros) {
          // Could update TIME_PER_ARGUMENT if needed, but keeping it constant for now
        }
      } catch (error: any) {
        console.error('Failed to load debate topic from database:', error);
        const errorMessage = error?.message || 'Failed to load debate topic from backend';
        console.error("Error details:", {
            message: errorMessage,
            stack: error?.stack,
            gameType: GAME_TYPE
        });
        // Show error - backend must provide content
        setError(`Failed to load debate topic from backend: ${errorMessage}. Please ensure backend is running and has content in database.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDebateTopic();
  }, []);

  // ============================================================================
  // STATEMENT DISPLAY COUNTDOWN
  // ============================================================================

  useEffect(() => {
    if (gameState === 'statementDisplay') {
      const timer = setInterval(() => {
        setStatementCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startProsWriting();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  // ============================================================================
  // START GAME
  // ============================================================================

  const startGame = () => {
    setProsArgument('');
    setConsArgument('');
    setProsTimeTaken(0);
    setConsTimeTaken(0);
    setStatementCountdown(STATEMENT_DISPLAY_TIME);
    setGameState('statementDisplay');
  };

  const startProsWriting = () => {
    setProsStartTime(Date.now());
    setIsProsTimerRunning(true);
    setGameState('prosWriting');
  };

  const startConsWriting = () => {
    setConsStartTime(Date.now());
    setIsConsTimerRunning(true);
    setGameState('consWriting');
  };

  // ============================================================================
  // HANDLE PROS SUBMISSION
  // ============================================================================

  const handleProsSubmit = () => {
    setIsProsTimerRunning(false);
    const timeTaken = prosStartTime > 0 ? (Date.now() - prosStartTime) / 1000 : TIME_PER_ARGUMENT;
    setProsTimeTaken(timeTaken);
    // Move to CONS writing phase
    setTimeout(() => {
      startConsWriting();
    }, 500);
  };

  // ============================================================================
  // HANDLE CONS SUBMISSION & FINAL SUBMIT
  // ============================================================================

  const handleConsSubmit = async () => {
    setIsConsTimerRunning(false);
    // Calculate and store cons time if not already set
    if (consTimeTaken === 0 && consStartTime > 0) {
      setConsTimeTaken((Date.now() - consStartTime) / 1000);
    }
    setGameState('completing');
    setSubmitting(true);

    try {
      // Use stored time taken, or calculate if not set
      const finalProsTime = prosTimeTaken > 0 ? prosTimeTaken : 
        (prosStartTime > 0 ? (Date.now() - prosStartTime) / 1000 : TIME_PER_ARGUMENT);
      
      const finalConsTime = consTimeTaken > 0 ? consTimeTaken :
        (consStartTime > 0 ? (Date.now() - consStartTime) / 1000 : TIME_PER_ARGUMENT);

      // Submit both arguments to backend in the format it expects
      const responseData = {
        debate_statement: debateTopic,
        pros_text: prosArgument,
        pros_time_taken: finalProsTime,
        cons_text: consArgument,
        cons_time_taken: finalConsTime,
        num_points_pros: prosArgument.split('\n').filter(line => line.trim().length > 0).length,
        num_points_cons: consArgument.split('\n').filter(line => line.trim().length > 0).length
      };

      // Submit with content_id to track which debate topic was used
      console.log('Submitting debate game with data:', { gameType: GAME_TYPE, responseData, contentId });
      const gameResult = await submitAIGame(
        GAME_TYPE, 
        responseData, 
        DEFAULT_USER_ID,
        contentId || undefined
      );

      console.log('Debate game result from backend:', gameResult);

      // Backend returns { session_id, version_used, ai_scores, final_scores } for AI games
      if (gameResult && (gameResult.final_scores || gameResult.scores || gameResult.session_id)) {
        setResult(gameResult);
        setGameState('results');
      } else {
        console.error('Invalid result from backend - missing scores or session_id:', gameResult);
        throw new Error(`Invalid response from backend. Expected scores or session_id, got: ${JSON.stringify(gameResult)}`);
      }
    } catch (error: any) {
      console.error('Error submitting debate:', error);
      const errorMessage = error?.message || 'Unknown error';
      console.error('Error details:', { error, message: errorMessage, stack: error?.stack });
      alert(`Failed to submit debate: ${errorMessage}. Check console for details.`);
      setGameState('consWriting');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // HANDLE TIMEOUTS
  // ============================================================================

  const handleProsTimeout = () => {
    setIsProsTimerRunning(false);
    setProsTimeTaken(TIME_PER_ARGUMENT); // Full time used
    // Auto-submit pros and move to cons
    setTimeout(() => {
      startConsWriting();
    }, 500);
  };

  const handleConsTimeout = async () => {
    setIsConsTimerRunning(false);
    setConsTimeTaken(TIME_PER_ARGUMENT); // Full time used
    // Auto-submit with whatever arguments we have
    await handleConsSubmit();
  };

  // ============================================================================
  // RENDER INSTRUCTIONS
  // ============================================================================

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading debate topic from backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Debate Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please ensure:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li>Backend server is running</li>
              <li>Backend has endpoint: <code className="bg-muted px-1 rounded">/api/content/ai_debate</code></li>
              <li>Database has content in <code className="bg-muted px-1 rounded">game_content</code> table</li>
              <li>Check browser console for detailed error logs</li>
            </ul>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="w-6 h-6 text-primary" />
                AI Debate Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  You will be shown a controversial statement.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your task is to argue BOTH sides. First, you will write for the PROS. Second, you will write for the CONS.
                </p>
                <p className="text-muted-foreground mb-4">
                  You will have 90 seconds to write your argument for each side.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your arguments will be analyzed. Good luck.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 1 debate statement</li>
                  <li>• 90 seconds for PROS argument</li>
                  <li>• 90 seconds for CONS argument</li>
                  <li>• AI evaluation of reasoning, analysis, and communication</li>
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

  // ============================================================================
  // RENDER STATEMENT DISPLAY
  // ============================================================================

  if (gameState === 'statementDisplay') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <h2 className="text-2xl font-bold">Get Ready...</h2>
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">Your debate topic is:</p>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-xl font-semibold italic">"{debateTopic}"</p>
                </div>
                <p className="text-muted-foreground">
                  Prepare to WRITE for the PROS (Agreeing) in {statementCountdown} seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER PROS WRITING
  // ============================================================================

  if (gameState === 'prosWriting') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>ARGUE FOR THE PROS</CardTitle>
                <Timer
                  key="pros"
                  isRunning={isProsTimerRunning}
                  initialTime={TIME_PER_ARGUMENT}
                  countDown
                  maxTime={TIME_PER_ARGUMENT}
                  onComplete={handleProsTimeout}
                />
              </div>
              <CardDescription>(Agreeing with the statement)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold mb-2">Statement:</p>
                <p className="italic">"{debateTopic}"</p>
              </div>
              <Textarea
                value={prosArgument}
                onChange={(e) => setProsArgument(e.target.value)}
                placeholder="Type your argument for the PROS side here..."
                rows={10}
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Write your strongest argument for this side before the time runs out.
              </p>
              <Button 
                onClick={handleProsSubmit} 
                className="w-full" 
                size="lg"
                disabled={!prosArgument.trim()}
              >
                Submit Argument
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER CONS WRITING
  // ============================================================================

  if (gameState === 'consWriting') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>ARGUE FOR THE CONS</CardTitle>
                <Timer
                  key="cons"
                  isRunning={isConsTimerRunning}
                  initialTime={TIME_PER_ARGUMENT}
                  countDown
                  maxTime={TIME_PER_ARGUMENT}
                  onComplete={handleConsTimeout}
                />
              </div>
              <CardDescription>(Disagreeing with the statement)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold mb-2">Statement:</p>
                <p className="italic">"{debateTopic}"</p>
              </div>
              <Textarea
                value={consArgument}
                onChange={(e) => setConsArgument(e.target.value)}
                placeholder="Type your argument for the CONS side here..."
                rows={10}
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Write your strongest argument for this side before the time runs out.
              </p>
              <Button 
                onClick={handleConsSubmit} 
                className="w-full" 
                size="lg"
                disabled={!consArgument.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Argument'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER COMPLETING
  // ============================================================================

  if (gameState === 'completing') {
    return (
      <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="pt-6 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">🎉 Challenge Complete! 🎉</h2>
              <p className="text-muted-foreground">
                Your responses are being analyzed by our AI evaluation system.
              </p>
              {submitting && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER RESULTS
  // ============================================================================

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <ScoreDisplay result={result} gameType={GAME_TYPE} />
          <div className="mt-6 flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DebateMode;
