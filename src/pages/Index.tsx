import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Settings, Target, Zap, Database, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            NeuRazor Scoring Testbed
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive platform for testing and refining cognitive assessment scoring algorithms.
            Play games, analyze scores, and fine-tune formulas in real-time.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Target className="w-10 h-10 text-primary mb-2" />
              <CardTitle>8 Cognitive Games</CardTitle>
              <CardDescription>
                Test memory, reasoning, speed, creativity, and more through interactive challenges
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-accent transition-colors">
            <CardHeader>
              <Settings className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Dynamic Configuration</CardTitle>
              <CardDescription>
                Modify all scoring formulas, weights, and AI prompts in real-time via the Scoring Controls
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-success transition-colors">
            <CardHeader>
              <Database className="w-10 h-10 text-success mb-2" />
              <CardTitle>Persistent Storage</CardTitle>
              <CardDescription>
                All configurations saved to localStorage, all results saved to Supabase database
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How to Use */}
        <Card className="mb-16 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6 text-primary" />
              How to Use This Testbed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Select a Game</h3>
                <p className="text-muted-foreground">
                  Choose from 8 cognitive games in the left sidebar. Each game tests different competencies
                  like memory, reasoning, speed, and creativity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Play the Game</h3>
                <p className="text-muted-foreground">
                  Complete the game to the best of your ability. Your performance data will be captured
                  automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Review Your Score</h3>
                <p className="text-muted-foreground">
                  See a detailed breakdown of your competency scores, weights, and final score. All results
                  are automatically saved to the database.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Adjust Scoring Formulas</h3>
                <p className="text-muted-foreground">
                  Click "Scoring Controls" at the bottom of the sidebar to modify weights, penalties,
                  multipliers, and AI prompts. Changes persist across sessions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Test & Iterate</h3>
                <p className="text-muted-foreground">
                  Play games again with your new configuration to see how scoring changes affect results.
                  Perfect for tuning your assessment algorithms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="w-6 h-6 text-primary" />
              Available Games
            </CardTitle>
            <CardDescription>
              Each game tests multiple cognitive competencies with configurable scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Mental Math Sprint</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Accuracy, Speed, Quantitative Aptitude, Mental Stamina
                </p>
                <Link to="/games/mental-math-easy">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Stroop Test</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Cognitive Flexibility, Agility, Accuracy, Speed
                </p>
                <Link to="/games/stroop-test-standard">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Statement Reasoning</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Reasoning, Logical Analysis, Critical Thinking
                </p>
                <Link to="/games/statement-reasoning">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Face-Name Match</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Memory, Accuracy, Speed
                </p>
                <Link to="/games/face-name-match-easy">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Card Flip Challenge</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Pattern Recognition, Reasoning, Strategy, Speed
                </p>
                <Link to="/games/card-flip-easy">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Scenario Challenge (AI)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Reasoning, Decision Making, Empathy, Creativity
                </p>
                <Link to="/games/scenario-challenge">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Debate Mode (AI)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Reasoning, Holistic Analysis, Cognitive Agility
                </p>
                <Link to="/games/debate-mode">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Creative Uses (AI)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests: Creativity (Originality, Diversity), Speed
                </p>
                <Link to="/games/creative-uses">
                  <Button size="sm" variant="outline">Try It</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
