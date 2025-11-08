import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';
import { submitAIGame, getGameContent } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';
import { Timer } from '@/components/game/Timer'; // Import Timer component

type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: { id: 'test-user-id' } }; // Mock user for development
};

const GAME_TYPE = 'scenario_challenge';
const TIME_PER_QUESTION = 120; // 2 minutes per question

interface Scenario {
    id: string | number;
    title: string;
    description: string;
    questions: {
        id: string | number;
        text: string;
    }[];
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

    useEffect(() => {
        const fetchScenario = async () => {
            try {
                setLoading(true);
                // Assuming getGameContent returns the full scenario object with questions
                const fetchedScenario = await getGameContent(GAME_TYPE) as Scenario;
                setScenario(fetchedScenario);
            } catch (error) {
                console.error("Failed to load scenario:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchScenario();
    }, []);

    const startGame = () => {
        setGameStarted(true);
        setQuestionStartTime(Date.now()); // Start timer for the first question
        setIsTimerRunning(true); // Start timer
    };

    const handleSubmitResponse = async () => {
        if (!user || !currentAnswer.trim() || !scenario) return;

        setSubmitting(true);
        try {
            const question = scenario.questions[currentQuestionIndex];
            const timeTaken = (Date.now() - questionStartTime) / 1000; // Calculate time taken

            const responseData = {
                scenario_text: scenario.description,
                question_text: question.text,
                response_text: currentAnswer,
                response_length: currentAnswer.length,
                time_taken: timeTaken, // Include time_taken
            };

            // Submit each answer individually and get a score
            const result = await submitAIGame(GAME_TYPE, responseData, user.id);

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
            } else {
                setFinalScore(result); // Set the final score from the last submission
                setIsFinished(true);
                setIsTimerRunning(false); // Stop timer when game finishes
            }
        } catch (error) {
            console.error("Error submitting scenario response:", error);
            alert("Failed to submit response. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTimeout = async () => {
        if (!user || !scenario) return;

        setSubmitting(true);
        try {
            const question = scenario.questions[currentQuestionIndex];
            const responseData = {
                scenario_text: scenario.description,
                question_text: question.text,
                response_text: '', // Empty response for timeout
                response_length: 0,
                time_taken: TIME_PER_QUESTION, // Max time taken for timeout
            };

            const result = await submitAIGame(GAME_TYPE, responseData, user.id);

            if (currentQuestionIndex < scenario.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setCurrentAnswer('');
                setQuestionStartTime(Date.now()); // Reset timer for next question
                setIsTimerRunning(true); // Restart timer
            } else {
                setFinalScore(result);
                setIsFinished(true);
                setIsTimerRunning(false);
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
                                {scenario.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Scenario</h3>
                                <p className="text-muted-foreground mb-4">
                                    {scenario.description}
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
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{scenario.title}</CardTitle>
                    <Timer
                        key={currentQuestionIndex} // Key to force re-render and reset timer
                        isRunning={isTimerRunning}
                        initialTime={TIME_PER_QUESTION}
                        countDown
                        maxTime={TIME_PER_QUESTION}
                        onComplete={handleTimeout}
                    />
                </div>
                <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="font-semibold">{currentQuestion.text}</p>
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
    );
};

export default ScenarioChallenge;