import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const FaceNameMatchEasy = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-primary" />
              Face-Name Match - Easy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Game implementation coming soon...
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                This game will test your memory, accuracy, and speed by matching faces to names.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaceNameMatchEasy;
