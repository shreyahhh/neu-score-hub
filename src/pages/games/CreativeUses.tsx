import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Play } from 'lucide-react';
type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: 'test-user-id' } }; // Mock user for development
};
import { submitAIGame, getGameContent } from '../../lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer'; // Import Timer component

const GAME_TYPE = 'creative_uses';
const GAME_DURATION = 60; // seconds

const CreativeUsesGame = () => {
    const { user } = useAuth();
    const [object, setObject] = useState('');
    const [uses, setUses] = useState<string[]>([]);
    const [currentUse, setCurrentUse] = useState('');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<GameResult | null>(null);
    const [gameStartTime, setGameStartTime] = useState<number>(0); // Track actual start time
    const [isTimerRunning, setIsTimerRunning] = useState(false); // Control timer
    const [gameStarted, setGameStarted] = useState(false); // Track if game has started

    useEffect(() => {
        const fetchGameObject = async () => {
            try {
                setLoading(true);
                const content = await getGameContent(GAME_TYPE);
                setObject(content.object_name);
            } catch (error) {
                console.error("Failed to load creative uses object:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGameObject();
    }, []);

    const startGame = () => {
        setGameStarted(true);
        setGameStartTime(Date.now()); // Record actual start time
        setIsTimerRunning(true); // Start timer
    };

    const handleFinish = async () => {
        setIsTimerRunning(false); // Stop timer
        setIsFinished(true);
        if (user) {
            setSubmitting(true);
            try {
                // Calculate actual time taken from start time
                const actualTimeTaken = (Date.now() - gameStartTime) / 1000;
                
                // Format data according to backend documentation for a single submission
                const responseData = {
                    object_name: object,
                    uses: uses,
                    time_taken: actualTimeTaken, // Use actual time taken
                    time_limit: GAME_DURATION
                };
                const result = await submitAIGame(GAME_TYPE, responseData, user.id);
                // Backend returns { session_id, version_used, ai_scores, final_scores }
                if (result && (result.final_scores || result.scores)) {
                    setScore(result);
                } else {
                    console.error('Invalid result from backend:', result);
                    alert('Failed to get scores. Please try again.');
                    setIsFinished(false);
                }
            } catch (error) {
                console.error("Error submitting creative uses game:", error);
                alert("Failed to submit game. Please try again.");
                setIsFinished(false); // Allow retry
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleTimeout = async () => {
        setIsTimerRunning(false);
        setIsFinished(true);
        if (user) {
            setSubmitting(true);
            try {
                // When timeout occurs, use the full duration
                const responseData = {
                    object_name: object,
                    uses: uses,
                    time_taken: GAME_DURATION, // Full duration on timeout
                    time_limit: GAME_DURATION
                };
                const result = await submitAIGame(GAME_TYPE, responseData, user.id);
                if (result && (result.final_scores || result.scores)) {
                    setScore(result);
                } else {
                    console.error('Invalid result from backend:', result);
                    alert('Failed to get scores. Please try again.');
                    setIsFinished(false);
                }
            } catch (error) {
                console.error("Error submitting creative uses game:", error);
                alert("Failed to submit game. Please try again.");
                setIsFinished(false);
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleAddUse = () => {
        if (currentUse.trim()) {
            setUses([...uses, currentUse.trim()]);
            setCurrentUse('');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (isFinished && score) {
        return <ScoreDisplay result={score} gameType={GAME_TYPE} />;
    }
    
    if (isFinished && submitting) {
        return <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground">Calculating your score...</p>
        </div>;
    }

    if (!gameStarted) {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                Creative Uses Challenge
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                                <p className="text-muted-foreground mb-4">
                                    List as many creative uses as you can think of for the given object within the time limit.
                                </p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Game Details:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• {GAME_DURATION} seconds time limit</li>
                                    <li>• Object: <strong>{object || 'Loading...'}</strong></li>
                                    <li>• Be creative and think outside the box!</li>
                                </ul>
                            </div>
                            <Button onClick={startGame} className="w-full" size="lg" disabled={!object}>
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
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Creative Uses Challenge</CardTitle>
                    <Timer
                        isRunning={isTimerRunning}
                        initialTime={GAME_DURATION}
                        countDown
                        maxTime={GAME_DURATION}
                        onComplete={handleTimeout}
                        onTick={(time) => setTimeLeft(time)} // Update timeLeft as timer counts down
                    />
                </div>
                <CardDescription>Time Left: {timeLeft}s</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4">List as many creative uses as you can for a: <strong className="text-primary">{object}</strong></p>
                <div className="flex gap-2 mb-4">
                    <Input
                        value={currentUse}
                        onChange={(e) => setCurrentUse(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddUse()}
                        placeholder="e.g., Use as a bookmark"
                        disabled={isFinished}
                    />
                    <Button onClick={handleAddUse} disabled={isFinished}><Plus className="w-4 h-4" /></Button>
                </div>
                <ul className="space-y-2">
                    {uses.map((use, index) => (
                        <li key={index} className="text-sm">{use}</li>
                    ))}
                </ul>
                <Button onClick={handleFinish} className="w-full mt-6" disabled={submitting || isFinished}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Finish
                </Button>
            </CardContent>
        </Card>
    );
};

export default CreativeUsesGame;