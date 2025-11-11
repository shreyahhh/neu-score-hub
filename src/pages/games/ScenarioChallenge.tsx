import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';
import { submitAIGame, getGameContent } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer'; // Import Timer component

import { DEFAULT_USER_ID } from '@/lib/api';

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: DEFAULT_USER_ID } }; // Uses user ID from .env
};

const GAME_TYPE = 'scenario_challenge';
const TIME_PER_QUESTION = 120; // 2 minutes per question

interface Scenario {
    content_id?: string; // ID from database
    game_type?: string;
    scenario: string; // Scenario text
    questions: {
        id: string;
        question: string;
        time_limit?: number;
    }[];
}

interface ResponseData {
    question_id: string;
    question_text: string;
    response_text: string;
    time_taken: number;
}

const ScenarioChallenge = () => {
    const { user } = useAuth();
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [finalScore, setFinalScore] = useState<GameResult | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0); // Track start time for each question
    const [isTimerRunning, setIsTimerRunning] = useState(false); // Control timer
    const [gameStarted, setGameStarted] = useState(false); // Track if game has started
    const [allResponses, setAllResponses] = useState<ResponseData[]>([]); // Store all responses for final submission
    const [contentId, setContentId] = useState<string | null>(null); // Track which content was used

    useEffect(() => {
        const fetchScenario = async () => {
            try {
                setLoading(true);
                // Fetch random scenario from database via /api/content/scenario_challenge
                const contentData = await getGameContent(GAME_TYPE);
                console.log('Fetched content from database:', contentData);
                
                // Validate and transform data structure
                if (!contentData || !contentData.scenario || !contentData.questions || contentData.questions.length === 0) {
                    throw new Error('Invalid scenario data from database');
                }
                
                // Store content_id for submission
                if (contentData.content_id) {
                    setContentId(contentData.content_id);
                }
                
                // Transform to match component's expected format
                const transformedScenario: Scenario = {
                    content_id: contentData.content_id,
                    game_type: contentData.game_type || GAME_TYPE,
                    scenario: contentData.scenario,
                    questions: contentData.questions.map((q: any) => ({
                        id: q.id || `q${Math.random()}`,
                        question: q.question || q.text || q,
                        time_limit: q.time_limit || TIME_PER_QUESTION
                    }))
                };
                
                setScenario(transformedScenario);
            } catch (error: any) {
                console.error("Failed to load scenario from database:", error);
                console.warn("Using fallback scenario data");
                // Fallback scenario data
                const fallbackScenario: Scenario = {
                    content_id: 'fallback-scenario-1',
                    game_type: GAME_TYPE,
                    scenario: "During Monday's team meeting, Raj interrupted Asha twice while she was making a presentation. Both times, he spoke over her while she was explaining a point on the slide.",
                    questions: [
                        {
                            id: 'q1',
                            question: 'What could be Raj\'s reasons for interrupting Asha? Share at least 3 distinct possibilities.',
                            time_limit: TIME_PER_QUESTION
                        },
                        {
                            id: 'q2',
                            question: 'What might Asha be feeling right now? Share at least 3 possibilities.',
                            time_limit: TIME_PER_QUESTION
                        },
                        {
                            id: 'q3',
                            question: 'Asha appeared happy that Raj interrupted her and explained the points. Share at least 3 possibilities as to why she might feel that way.',
                            time_limit: TIME_PER_QUESTION
                        },
                        {
                            id: 'q4',
                            question: '5 minutes later, Asha requested Raj to continue the presentation. What explains it? Share at least 3 possibilities.',
                            time_limit: TIME_PER_QUESTION
                        }
                    ]
                };
                setScenario(fallbackScenario);
                setContentId('fallback-scenario-1');
            } finally {
                setLoading(false);
            }
        };
        fetchScenario();
    }, []);

    const startGame = () => {
        setGameStarted(true);
        setAllResponses([]); // Reset responses
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
        setQuestionStartTime(Date.now()); // Start timer for the first question
        setIsTimerRunning(true); // Start timer
    };

    const handleSubmitResponse = async () => {
        if (!user || !currentAnswer.trim() || !scenario) return;

        setSubmitting(true);
        try {
            const question = scenario.questions[currentQuestionIndex];
            const timeTaken = (Date.now() - questionStartTime) / 1000; // Calculate time taken

            const responseData: ResponseData = {
                question_id: question.id,
                question_text: question.question,
                response_text: currentAnswer,
                time_taken: timeTaken
            };

            // Store response for final submission
            const updatedResponses = [...allResponses, responseData];
            setAllResponses(updatedResponses);

            // Move to the next question or finish the game
            if (currentQuestionIndex < scenario.questions.length - 1) {
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
            console.error("Error submitting scenario response:", error);
            alert("Failed to submit response. Please try again.");
            setSubmitting(false);
        }
    };

    // Submit all responses at once to create a single session
    const submitAllResponses = async (responses: ResponseData[]) => {
        try {
            setSubmitting(true);
            
            // Prepare response data in the format backend expects
            // Backend expects: { responses: [...] }
            const responseData = {
                responses: responses.map(r => ({
                    question_id: r.question_id,
                    question_text: r.question_text,
                    response_text: r.response_text,
                    time_taken: r.time_taken
                }))
            };
            
            console.log('Submitting scenario challenge with data:', { gameType: GAME_TYPE, responseData, contentId });
            // Submit with content_id to track which scenario was used
            const result = await submitAIGame(
                GAME_TYPE, 
                responseData, 
                user?.id,
                contentId || undefined
            );

            console.log('Scenario challenge result from backend:', result);

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
        if (!user || !scenario) return;

        setSubmitting(true);
        try {
            const question = scenario.questions[currentQuestionIndex];
            const responseData: ResponseData = {
                question_id: question.id,
                question_text: question.question,
                response_text: '', // Empty response for timeout
                time_taken: TIME_PER_QUESTION // Max time taken for timeout
            };

            // Store timeout response
            const updatedResponses = [...allResponses, responseData];
            setAllResponses(updatedResponses);

            if (currentQuestionIndex < scenario.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setCurrentAnswer('');
                setQuestionStartTime(Date.now()); // Reset timer for next question
                setIsTimerRunning(true); // Restart timer
                setSubmitting(false);
            } else {
                // Last question timed out - submit all responses
                setIsTimerRunning(false);
                await submitAllResponses(updatedResponses);
            }
        } catch (error) {
            console.error("Error handling timeout:", error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading scenario from backend...</p>
            </div>
        );
    }

    if (isFinished && finalScore) {
        return <ScoreDisplay result={finalScore} gameType={GAME_TYPE} />;
    }

    if (!scenario || !scenario.questions || scenario.questions.length === 0) {
        return <div className="text-center text-destructive">Failed to load game content.</div>;
    }

    if (!gameStarted) {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                Scenario Challenge
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Scenario</h3>
                                <p className="text-muted-foreground mb-4">
                                    {scenario.scenario}
                                </p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Game Details:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• {scenario.questions.length} questions</li>
                                    <li>• {TIME_PER_QUESTION / 60} minutes per question</li>
                                    <li>• Think carefully about each response</li>
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

    const currentQuestion = scenario.questions[currentQuestionIndex];

    return (
        <div className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-3xl w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Scenario Challenge</CardTitle>
                    <Timer
                        key={currentQuestionIndex} // Key to force re-render and reset timer
                        isRunning={isTimerRunning}
                        initialTime={TIME_PER_QUESTION}
                        countDown
                        maxTime={TIME_PER_QUESTION}
                        onComplete={handleTimeout}
                    />
                </div>
                <CardDescription>{scenario.scenario}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="font-semibold">{currentQuestion.question}</p>
                    <p className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {scenario.questions.length}
                    </p>
                    <Textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Describe your response to the situation..."
                        rows={8}
                    />
                    <Button onClick={handleSubmitResponse} disabled={submitting || !currentAnswer.trim()}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {currentQuestionIndex < scenario.questions.length - 1 ? 'Submit and Go to Next Question' : 'Finish & Submit'}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
    );
};

export default ScenarioChallenge;