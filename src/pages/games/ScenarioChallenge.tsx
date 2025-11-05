import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const ScenarioChallenge = () => {
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
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Game implementation coming soon...
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                This AI-powered game will test your reasoning, decision making, empathy, creativity, and communication.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScenarioChallenge;
