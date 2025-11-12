import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Play } from 'lucide-react';
import { DEFAULT_USER_ID } from '@/lib/api';

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: DEFAULT_USER_ID } }; // Uses user ID from .env
};
import { submitAIGame, getGameContent } from '../../lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer'; // Import Timer component

const GAME_TYPE = 'creative_uses';
const DEFAULT_GAME_DURATION = 60; // seconds

// Fallback objects for Creative Uses game
const FALLBACK_OBJECTS = [
    'A Paperclip',
    'A Bottle',
    'A Pencil'
];

// Get a random fallback object
const getRandomFallbackObject = (): string => {
    return FALLBACK_OBJECTS[Math.floor(Math.random() * FALLBACK_OBJECTS.length)];
};

const CreativeUsesGame = () => {
    const { user } = useAuth();
    const [object, setObject] = useState<string>('');
    const [gameDuration, setGameDuration] = useState(DEFAULT_GAME_DURATION);
    const [contentId, setContentId] = useState<string | null>(null); // Track which content was used
    const [uses, setUses] = useState<string[]>([]);
    const [currentUse, setCurrentUse] = useState('');
    const [timeLeft, setTimeLeft] = useState(DEFAULT_GAME_DURATION);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<GameResult | null>(null);
    const [gameStartTime, setGameStartTime] = useState<number>(0); // Track actual start time
    const [isTimerRunning, setIsTimerRunning] = useState(false); // Control timer
    const [gameStarted, setGameStarted] = useState(false); // Track if game has started

    // Fetch object from database on component mount
    useEffect(() => {
        const fetchObject = async () => {
            try {
                setLoading(true);
                const contentData = await getGameContent(GAME_TYPE);
                console.log('Fetched creative uses content from database:', contentData);
                
                // Extract object name from content data
                const objectName = contentData?.object || 
                                   contentData?.object_name || 
                                   null;
                
                if (objectName) {
                    setObject(objectName);
                } else {
                    // If backend doesn't provide object, use random fallback
                    console.warn('Backend did not provide object, using random fallback');
                    const fallbackObject = getRandomFallbackObject();
                    setObject(fallbackObject);
                    setContentId('fallback-creative-' + fallbackObject.toLowerCase().replace(/\s+/g, '-'));
                }
                
                // Extract time limit if provided
                if (contentData?.time_limit) {
                    setGameDuration(contentData.time_limit);
                    setTimeLeft(contentData.time_limit);
                }
                
                // Store content_id for submission
                if (contentData?.content_id) {
                    setContentId(contentData.content_id);
                }
            } catch (error: any) {
                console.error('Failed to load object from database:', error);
                console.warn('Using fallback object');
                // Use random fallback object if backend fails
                const fallbackObject = getRandomFallbackObject();
                setObject(fallbackObject);
                setContentId('fallback-creative-' + fallbackObject.toLowerCase().replace(/\s+/g, '-'));
            } finally {
                setLoading(false);
            }
        };
        
        fetchObject();
    }, []);

    const startGame = () => {
        if (!object) return; // Don't start if object not loaded
        setGameStarted(true);
        setUses([]);
        setCurrentUse('');
        setTimeLeft(gameDuration);
        setGameStartTime(Date.now()); // Record actual start time
        setIsTimerRunning(true); // Start timer
    };

    const handleFinish = async () => {
        setIsTimerRunning(false); // Stop timer
        
        if (user) {
            setSubmitting(true);
            try {
                // Calculate actual time taken from start time
                const actualTimeTaken = (Date.now() - gameStartTime) / 1000;
                
                // Format data according to backend documentation
                const responseData = {
                    object_name: object,
                    uses: uses,
                    time_taken: actualTimeTaken, // Use actual time taken
                    time_limit: gameDuration
                };
                
                console.log('Submitting creative uses game with data:', { gameType: GAME_TYPE, responseData, contentId });
                // Submit with content_id to track which object was used
                const result = await submitAIGame(
                    GAME_TYPE, 
                    responseData, 
                    user.id,
                    contentId || undefined
                );
                
                console.log('Creative uses game result from backend:', result);
                
                // Backend returns { session_id, version_used, ai_scores, final_scores } for AI games
                if (result && (result.final_scores || result.scores || result.session_id)) {
                    setScore(result);
                    setIsFinished(true);
                } else {
                    console.error('Invalid result from backend - missing scores or session_id:', result);
                    alert(`Failed to get scores. Backend returned: ${JSON.stringify(result)}`);
                }
            } catch (error: any) {
                console.error("Error submitting creative uses game:", error);
                const errorMessage = error?.message || 'Unknown error';
                console.error('Error details:', { error, message: errorMessage, stack: error?.stack });
                alert(`Failed to submit game: ${errorMessage}. Check console for details.`);
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleTimeout = async () => {
        setIsTimerRunning(false);
        
        if (user) {
            setSubmitting(true);
            try {
                // When timeout occurs, use the full duration
                const actualTimeTaken = gameStartTime > 0 
                    ? (Date.now() - gameStartTime) / 1000 
                    : gameDuration;
                
                const responseData = {
                    object_name: object,
                    uses: uses,
                    time_taken: actualTimeTaken,
                    time_limit: gameDuration
                };
                
                console.log('Submitting creative uses game (timeout) with data:', { gameType: GAME_TYPE, responseData, contentId });
                // Submit with content_id to track which object was used
                const result = await submitAIGame(
                    GAME_TYPE, 
                    responseData, 
                    user.id,
                    contentId || undefined
                );
                
                console.log('Creative uses game result from backend (timeout):', result);
                
                // Backend returns { session_id, version_used, ai_scores, final_scores } for AI games
                if (result && (result.final_scores || result.scores || result.session_id)) {
                    setScore(result);
                    setIsFinished(true);
                } else {
                    console.error('Invalid result from backend - missing scores or session_id:', result);
                    alert(`Failed to get scores. Backend returned: ${JSON.stringify(result)}`);
                }
            } catch (error: any) {
                console.error("Error submitting creative uses game (timeout):", error);
                const errorMessage = error?.message || 'Unknown error';
                console.error('Error details:', { error, message: errorMessage, stack: error?.stack });
                alert(`Failed to submit game: ${errorMessage}. Check console for details.`);
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
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading object from backend...</p>
            </div>
        );
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
                                    List as many creative uses as you can think of for the given objects within the time limit.
                                </p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Game Details:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• {gameDuration} seconds to complete</li>
                                    <li>• Be creative and think outside the box!</li>
                                    {object && <li>• Object: <strong>{object.replace(/^A /, '')}</strong></li>}
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
            <Card className="max-w-lg w-full">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Creative Uses Challenge</CardTitle>
                        <Timer
                            isRunning={isTimerRunning}
                            initialTime={gameDuration}
                            countDown
                            maxTime={gameDuration}
                            onComplete={handleTimeout}
                            onTick={(time) => setTimeLeft(time)} // Update timeLeft as timer counts down
                        />
                    </div>
                    <CardDescription>
                        Time Left: {Math.max(0, timeLeft)}s
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">List as many creative uses as you can for: <strong className="text-primary capitalize">{object.replace(/^A /, '')}</strong></p>
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
        </div>
    );
};

export default CreativeUsesGame;