"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScoringConfig } from '@/context/ScoringConfigContext';
import { ScoringConfig } from '@/lib/types';
import { toast } from 'sonner';

interface ScoringControlsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScoringControlsModal({ open, onOpenChange }: ScoringControlsModalProps) {
  const { config, updateConfig, resetConfig } = useScoringConfig();
  const [editedConfig, setEditedConfig] = useState<ScoringConfig>(config);

  // Update local state when modal opens
  React.useEffect(() => {
    if (open) {
      setEditedConfig(config);
    }
  }, [open, config]);

  const handleSave = () => {
    updateConfig(editedConfig);
    toast.success('Scoring configuration saved successfully');
    onOpenChange(false);
  };

  const handleReset = () => {
    resetConfig();
    setEditedConfig(config);
    toast.success('Scoring configuration reset to defaults');
  };

  const updateWeight = (game: keyof ScoringConfig, competency: string, value: number) => {
    setEditedConfig({
      ...editedConfig,
      [game]: {
        ...editedConfig[game],
        weights: {
          ...(editedConfig[game] as any).weights,
          [competency]: value,
        },
      },
    });
  };

  const updateNestedValue = (game: keyof ScoringConfig, section: string, field: string, value: any) => {
    setEditedConfig({
      ...editedConfig,
      [game]: {
        ...editedConfig[game],
        [section]: {
          ...(editedConfig[game] as any)[section],
          [field]: value,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Scoring Controls</DialogTitle>
          <DialogDescription>
            Modify scoring formulas, weights, and AI prompts for all games. Changes persist in localStorage.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mentalMath" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="mentalMath">Mental Math</TabsTrigger>
            <TabsTrigger value="stroopTest">Stroop Test</TabsTrigger>
            <TabsTrigger value="signSudoku">Sign Sudoku</TabsTrigger>
            <TabsTrigger value="faceNameMatch">Face-Name</TabsTrigger>
            <TabsTrigger value="cardFlip">Card Flip</TabsTrigger>
            <TabsTrigger value="scenarioChallenge">Scenario</TabsTrigger>
            <TabsTrigger value="debateMode">Debate</TabsTrigger>
            <TabsTrigger value="creativeUses">Creative Uses</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            {/* Mental Math */}
            <TabsContent value="mentalMath" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.mentalMath.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('mentalMath', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Accuracy Mode</h3>
                <select
                  className="w-full p-2 border rounded"
                  value={editedConfig.mentalMath.accuracy.mode}
                  onChange={(e) => updateNestedValue('mentalMath', 'accuracy', 'mode', e.target.value)}
                >
                  <option value="binary">Binary (100 or 0)</option>
                  <option value="graded">Graded (100 - % Error)</option>
                </select>
              </div>
            </TabsContent>

            {/* Stroop Test */}
            <TabsContent value="stroopTest" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.stroopTest.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('stroopTest', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Sign Sudoku */}
            <TabsContent value="signSudoku" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.signSudoku.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('signSudoku', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Face-Name Match */}
            <TabsContent value="faceNameMatch" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.faceNameMatch.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('faceNameMatch', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Card Flip */}
            <TabsContent value="cardFlip" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.cardFlip.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('cardFlip', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Scenario Challenge */}
            <TabsContent value="scenarioChallenge" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.scenarioChallenge.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('scenarioChallenge', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">AI Prompt</h3>
                <Textarea
                  rows={6}
                  value={editedConfig.scenarioChallenge.aiPrompt}
                  onChange={(e) => setEditedConfig({
                    ...editedConfig,
                    scenarioChallenge: {
                      ...editedConfig.scenarioChallenge,
                      aiPrompt: e.target.value,
                    },
                  })}
                />
              </div>
            </TabsContent>

            {/* Debate Mode */}
            <TabsContent value="debateMode" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.debateMode.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('debateMode', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">AI Prompt</h3>
                <Textarea
                  rows={6}
                  value={editedConfig.debateMode.aiPrompt}
                  onChange={(e) => setEditedConfig({
                    ...editedConfig,
                    debateMode: {
                      ...editedConfig.debateMode,
                      aiPrompt: e.target.value,
                    },
                  })}
                />
              </div>
            </TabsContent>

            {/* Creative Uses */}
            <TabsContent value="creativeUses" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Final Weights</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.creativeUses.weights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateWeight('creativeUses', key, parseFloat(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">AI Prompt</h3>
                <Textarea
                  rows={6}
                  value={editedConfig.creativeUses.aiPrompt}
                  onChange={(e) => setEditedConfig({
                    ...editedConfig,
                    creativeUses: {
                      ...editedConfig.creativeUses,
                      aiPrompt: e.target.value,
                    },
                  })}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
