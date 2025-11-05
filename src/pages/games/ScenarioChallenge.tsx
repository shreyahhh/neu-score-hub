import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Play, Mic, Edit3 } from 'lucide-react';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { useScoringConfig } from '@/context/ScoringConfigContext';
import { calculateScenarioChallengeScore } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Sample scenarios
const SCENARIOS = [
  {
    id: 1,
    title: 'Team Meeting Interruption',
    description: `You're leading an important project meeting with 6 team members when a colleague interrupts repeatedly with off-topic questions. The meeting is running late, and you still have critical decisions to make. Some team members look frustrated, while others seem disengaged.`,
    questions: [
      {
        id: 1,
        text: 'What would you do in this situation? Explain your reasoning.',
        type: 'reasoning' as const,
        competencies: ['reasoning', 'decision-making'],
      },
      {
        id: 2,
        text: 'How would you address the colleague behavior while maintaining team morale?',
        type: 'empathy' as const,
        competencies: ['empathy', 'communication'],
      },
      {
        id: 3,
        text: 'What creative solutions could prevent this situation in future meetings?',
        type: 'imagination' as const,
        competencies: ['creativity'],
      },
      {
        id: 4,
        text: 'Evaluate your proposed approach. What are its strengths and potential weaknesses?',
        type: 'critique' as const,
        competencies: ['reasoning', 'decision-making'],
      },
    ],
  },
];

type GameState = 'instructions' | 'reading' | 'playing' | 'results';
type InputMode = 'voice' | 'editing';

const ScenarioChallenge = () => {
  const { config } = useScoringConfig();
  const [gameState, setGameState] = useState<GameState>('instructions');
  const [currentScenario] = useState(SCENARIOS[0]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startGame = () => {
    setGameState('reading');
    // Simulate reading time, then move to first question
    setTimeout(() => {
      setGameState('playing');
      setCurrentQuestion(0);
      setInputMode('voice');
    }, 10000); // 10 second reading time
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.info('Recording started (simulated)');
    
    // Simulate voice recording
    setTimeout(() => {
      setIsRecording(false);
      setTranscript('This is a simulated transcript. In a real implementation, this would contain the speech-to-text result of the user\'s voice response.');
      setInputMode('editing');
      toast.success('Recording complete. You can now edit your response.');
    }, 3000);
  };

  const handleSubmitResponse = async () => {
    const question = currentScenario.questions[currentQuestion];
    
    const response = {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      transcript: transcript,
      wordCount: transcript.split(' ').length,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestion < currentScenario.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setInputMode('voice');
      setTranscript('');
    } else {
      await finishGame(newResponses);
    }
  };

  const finishGame = async (finalResponses: any[]) => {
    // In a real implementation, this would call AI API for scoring
    // For now, using mock scores
    const mockAiScores = {
      reasoning: 75,
      decisionMaking: 80,
      empathy: 85,
      creativity: 70,
      communication: 78,
    };

    const gameResult = calculateScenarioChallengeScore(config.scenarioChallenge, mockAiScores);
    
    setResult(gameResult);
    setGameState('results');

    // Save to database
    try {
      await supabase.from('game_results').insert({
        game_id: 'scenario-challenge',
        score_data: {
          ...gameResult,
          responses: finalResponses,
        },
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  if (gameState === 'instructions') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="w-6 h-6 text-primary" />
                Scenario Challenge (AI)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground mb-4">
                  You will be presented with a workplace scenario and 4 questions. For each question:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Record your voice response (or type directly in this demo)</li>
                  <li>Review and edit the auto-generated transcript</li>
                  <li>Submit your final answer</li>
                </ol>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Game Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 1 scenario with 4 questions</li>
                  <li>• Voice input with transcript editing</li>
                  <li>• AI-powered evaluation</li>
                  <li>• Measures reasoning, empathy, creativity, and more</li>
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Note:</strong> This is a simplified demo version. Voice recording is simulated. 
                  Full AI evaluation would require backend integration with Lovable AI.
                </p>
              </div>
              <Button onClick={startGame} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'reading') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Read the Scenario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">{currentScenario.title}</h3>
                <p className="text-lg leading-relaxed">{currentScenario.description}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Please read the scenario carefully. Questions will appear in 10 seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const question = currentScenario.questions[currentQuestion];
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Scenario (always visible) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-bold mb-2">{currentScenario.title}</h3>
                  <p className="text-sm">{currentScenario.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Right: Question and Response */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Question {currentQuestion + 1} of {currentScenario.questions.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressBar current={currentQuestion + 1} total={currentScenario.questions.length} />
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-medium">{question.text}</p>
                </div>

                {inputMode === 'voice' ? (
                  <div className="text-center space-y-4">
                    <Button
                      onClick={handleStartRecording}
                      disabled={isRecording}
                      size="lg"
                      className="w-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {isRecording ? 'Recording...' : 'Start Recording'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Or type your response:
                    </p>
                    <Textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Type your response here..."
                      rows={6}
                    />
                    {transcript && (
                      <Button onClick={() => setInputMode('editing')} className="w-full">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Continue to Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Edit your response:
                      </label>
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        rows={8}
                        placeholder="Edit your transcript here..."
                      />
                    </div>
                    <Button onClick={handleSubmitResponse} className="w-full" size="lg" disabled={!transcript.trim()}>
                      Submit Response
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results' && result) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <ScoreDisplay result={result} />
        </div>
      </div>
    );
  }

  return null;
};

export default ScenarioChallenge;
