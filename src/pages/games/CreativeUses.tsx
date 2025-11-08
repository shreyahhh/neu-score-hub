import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
type AuthUser = { id: string };
const useAuth = (): { user: AuthUser | null } => {
    return { user: null };
};
import { submitAIGame, getGameContent } from '../../lib/api';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameResult } from '@/lib/types';

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
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchGameObject = async () => {
            try {
                setLoading(true);
                const content = await getGameContent(GAME_TYPE);
                setObject(content.object_name);
                startTimer();
            } catch (error) {
                console.error("Failed to load creative uses object:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGameObject();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleFinish = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsFinished(true);
        if (user) {
            setSubmitting(true);
            try {
                // Format data according to backend documentation for a single submission
                const responseData = {
                    object_name: object,
                    uses: uses,
                    time_taken: GAME_DURATION - timeLeft,
                    time_limit: GAME_DURATION
                };
                const result = await submitAIGame(GAME_TYPE, responseData, user.id);
                setScore(result);
            } catch (error) {
                console.error("Error submitting creative uses game:", error);
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
        return <ScoreDisplay result={score} />;
    }
    
    if (isFinished && !score) {
        return <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground">Calculating your score...</p>
        </div>;
    }

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Creative Uses Challenge</CardTitle>
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