import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3x3 } from 'lucide-react';

const SignSudokuEasy = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Grid3x3 className="w-6 h-6 text-primary" />
              Sign Sudoku - Easy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Game implementation coming soon...
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                This game will test your reasoning, attention to detail, math skills, and speed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignSudokuEasy;
