import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Play, Home } from 'lucide-react';
import { submitAIGame, getGameContent, DEFAULT_USER_ID } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer';
import { useNavigate } from 'react-router-dom';

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: DEFAULT_USER_ID } };
};

const GAME_TYPE = 'statement_reasoning';
const TIME_LIMIT = 180; // 3 minutes per question

interface StatementSet {
    content_id?: string;
    game_type?: string;
    statements: string[]; // Array of 3 statements
    question: string; // Question about the connection
    time_limit?: number;
}

const StatementReasoning = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [statementSet, setStatementSet] = useState<StatementSet | null>(null);
    const [response, setResponse] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<GameResult | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Fetch statement set from backend
    useEffect(() => {
        const fetchStatementSet = async () => {
            try {
                setLoading(true);
                const contentData = await getGameContent(GAME_TYPE);
                console.log('Fetched statement reasoning content from database:', contentData);
                
                // Validate and transform data structure
                if (!contentData || !contentData.statements || !Array.isArray(contentData.statements) || contentData.statements.length === 0) {
                    throw new Error('Invalid statement set data from database');
                }
                
                const transformedSet: StatementSet = {
                    content_id: contentData.content_id,
                    game_type: contentData.game_type || GAME_TYPE,
                    statements: contentData.statements,
                    question: contentData.question || 'What logical connection can you identify between these statements?',
                    time_limit: contentData.time_limit || TIME_LIMIT
                };
                
                setStatementSet(transformedSet);
                setTimeLeft(transformedSet.time_limit || TIME_LIMIT);
            } catch (error: any) {
                console.error("Failed to load statement set from database:", error);
                console.warn("Using fallback statement set");
                // Fallback statement set
                const fallbackSet: StatementSet = {
                    content_id: 'fallback-reasoning-1',
                    game_type: GAME_TYPE,
                    statements: [
                        'All successful entrepreneurs take calculated risks.',
                        'Sarah started her business with minimal capital.',
                        'Sarah\'s business is now profitable after two years.'
                    ],
                    question: 'What logical connection can you identify between these statements?',
                    time_limit: TIME_LIMIT
                };
                setStatementSet(fallbackSet);
                setTimeLeft(TIME_LIMIT);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatementSet();
    }, []);

    const startGame = () => {
        if (!statementSet) return;
        setGameStarted(true);
        setResponse('');
        setStartTime(Date.now());
        setIsTimerRunning(true);
        setTimeLeft(statementSet.time_limit || TIME_LIMIT);
    };

    const handleSubmit = async () => {
        if (!statementSet || !response.trim()) {
            alert('Please provide a response before submitting.');
            return;
        }

        if (!user) {
            alert('User not found. Please refresh the page.');
            return;
        }

        setSubmitting(true);
        setIsTimerRunning(false);

        try {
            const timeTaken = startTime > 0 ? (Date.now() - startTime) / 1000 : TIME_LIMIT - timeLeft;
            
            // Format data according to backend documentation
            const responseData = {
                statements: statementSet.statements,
                response_text: response.trim(),
                response_length: response.trim().length,
                time_taken: timeTaken,
                time_limit: statementSet.time_limit || TIME_LIMIT
            };

            console.log('Submitting statement reasoning game with data:', { 
                gameType: GAME_TYPE, 
                responseData, 
                contentId: statementSet.content_id 
            });

            // Submit with content_id to track which statement set was used
            const gameResult = await submitAIGame(
                GAME_TYPE,
                responseData,
                user.id,
                statementSet.content_id || undefined
            );

            console.log('Statement reasoning game result from backend:', gameResult);

            // Backend returns { session_id, version_used, ai_scores, final_scores } for AI games
            if (gameResult && (gameResult.final_scores || gameResult.scores || gameResult.session_id)) {
                setResult(gameResult);
                setIsFinished(true);
            } else {
                console.error('Invalid result from backend - missing scores or session_id:', gameResult);
                alert(`Failed to get scores. Backend returned: ${JSON.stringify(gameResult)}`);
            }
        } catch (error: any) {
            console.error("Error submitting statement reasoning game:", error);
            const errorMessage = error?.message || 'Unknown error';
            console.error('Error details:', { error, message: errorMessage, stack: error?.stack });
            alert(`Failed to submit game: ${errorMessage}. Check console for details.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTimeout = async () => {
        setIsTimerRunning(false);
        // Auto-submit with whatever response we have
        if (response.trim()) {
            await handleSubmit();
        } else {
            // Submit empty response if timeout
            setSubmitting(true);
            try {
                const timeTaken = TIME_LIMIT;
                const responseData = {
                    statements: statementSet?.statements || [],
                    response_text: '',
                    response_length: 0,
                    time_taken: timeTaken,
                    time_limit: statementSet?.time_limit || TIME_LIMIT
                };

                const gameResult = await submitAIGame(
                    GAME_TYPE,
                    responseData,
                    user?.id || DEFAULT_USER_ID,
                    statementSet?.content_id || undefined
                );

                if (gameResult && (gameResult.final_scores || gameResult.scores || gameResult.session_id)) {
                    setResult(gameResult);
                    setIsFinished(true);
                }
            } catch (error: any) {
                console.error("Error submitting statement reasoning game (timeout):", error);
                alert(`Failed to submit game: ${error?.message || 'Unknown error'}`);
            } finally {
                setSubmitting(false);
            }
        }
    };

    const restartGame = () => {
        setGameStarted(false);
        setResponse('');
        setIsFinished(false);
        setResult(null);
        setStartTime(0);
        setIsTimerRunning(false);
        setTimeLeft(statementSet?.time_limit || TIME_LIMIT);
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading statement set from backend...</p>
            </div>
        );
    }

    if (isFinished && result) {
        return (
            <div className="min-h-screen bg-gradient-subtle p-6">
                <div className="max-w-4xl mx-auto">
                    <ScoreDisplay result={result} gameType={GAME_TYPE} />
                    <div className="mt-6 flex gap-4 justify-center">
                        <Button onClick={restartGame} size="lg">
                            <Play className="w-4 h-4 mr-2" />
                            Play Again
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" size="lg">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (isFinished && submitting) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Calculating your score...</p>
            </div>
        );
    }

    if (!statementSet) {
        return (
            <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
                <Card className="max-w-2xl w-full">
                    <CardContent className="py-12 text-center">
                        <p className="text-destructive">Failed to load statement set.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!gameStarted) {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                Statement Reasoning Challenge
                            </CardTitle>
                            <CardDescription>
                                Analyze the logical connections between statements
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                                <p className="text-muted-foreground mb-4">
                                    You will be shown three statements. Your task is to identify and explain the logical connection between them.
                                </p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Game Details:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• {statementSet.time_limit || TIME_LIMIT} seconds to complete</li>
                                    <li>• Read all statements carefully</li>
                                    <li>• Explain the logical connection clearly</li>
                                    <li>• Be specific and detailed in your response</li>
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
        <div className="container mx-auto px-6 py-8 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Statement Reasoning Challenge</CardTitle>
                            <Timer
                                isRunning={isTimerRunning}
                                initialTime={timeLeft}
                                countDown
                                maxTime={statementSet.time_limit || TIME_LIMIT}
                                onComplete={handleTimeout}
                                onTick={(time) => setTimeLeft(time)}
                            />
                        </div>
                        <CardDescription>
                            Time Left: {Math.max(0, timeLeft)}s
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Statements:</h3>
                            <div className="space-y-3">
                                {statementSet.statements.map((statement, index) => (
                                    <div key={index} className="p-4 bg-muted rounded-lg">
                                        <p className="font-semibold mb-1">Statement {index + 1}:</p>
                                        <p>{statement}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Question:</h3>
                            <p className="text-lg">{statementSet.question}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Your Response:
                            </label>
                            <Textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Explain the logical connection between these statements..."
                                className="min-h-[200px]"
                                disabled={submitting || isFinished}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                {response.length} characters
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            className="w-full"
                            size="lg"
                            disabled={submitting || isFinished || !response.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Response'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StatementReasoning;

