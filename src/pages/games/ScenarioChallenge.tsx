import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { submitAIGame, getGameContent } from '@/lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';

const GAME_TYPE = 'scenario_challenge';

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

    useEffect(() => {
        const fetchScenario = async () => {
            try {
                setLoading(true);
                // Assuming getGameContent returns the full scenario object with questions
                const fetchedScenario = await getGameContent(GAME_TYPE);
                setScenario(fetchedScenario);
            } catch (error) {
                console.error("Failed to load scenario:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchScenario();
    }, []);

    const handleSubmitResponse = async () => {
        if (!user || !currentAnswer.trim() || !scenario) return;

        setSubmitting(true);
        try {
            const question = scenario.questions[currentQuestionIndex];
            const responseData = {
                scenario_text: scenario.description,
                question_text: question.text,
                response_text: currentAnswer,
                response_length: currentAnswer.length,
            };

            // Submit each answer individually and get a score
            const result = await submitAIGame(GAME_TYPE, responseData, user.id);

            // Move to the next question or finish the game
            if (currentQuestionIndex < scenario.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setCurrentAnswer('');
            } else {
                setFinalScore(result); // Set the final score from the last submission
                setIsFinished(true);
            }
        } catch (error) {
            console.error("Error submitting scenario response:", error);
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

    if (!scenario) {
        return <div className="text-center text-destructive">Failed to load game content.</div>;
    }

    const currentQuestion = scenario.questions[currentQuestionIndex];

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>{scenario.title}</CardTitle>
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