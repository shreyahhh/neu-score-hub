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
import { GameType, getActiveScoringVersion } from '@/lib/supabase';
import { toast } from 'sonner';

interface ScoringControlsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScoringControlsModal({ open, onOpenChange }: ScoringControlsModalProps) {
  const { config, updateConfig, loadGameConfig } = useScoringConfig();
  const [editedConfig, setEditedConfig] = useState<any>({});
  const [activeTab, setActiveTab] = useState<GameType>('mental_math_sprint');
  const [loading, setLoading] = useState(false);

  // Load config when tab changes
  React.useEffect(() => {
    if (open && activeTab) {
      loadConfig(activeTab);
    }
  }, [open, activeTab]);

  const loadConfig = async (gameType: GameType) => {
    try {
      setLoading(true);
      const version = await getActiveScoringVersion(gameType);
      setEditedConfig(version.config);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration from database. Using default values.');
      // Set default config as fallback
      setEditedConfig(config[gameType] || { final_weights: {}, competency_formulas: {}, settings: {} });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateConfig(activeTab, editedConfig, 'Updated via UI');
      toast.success(`Configuration saved as new version for ${activeTab}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateFinalWeight = (competency: string, value: number) => {
    setEditedConfig((prev: any) => ({
      ...prev,
      final_weights: {
        ...prev.final_weights,
        [competency]: value,
      },
    }));
  };

  const updateFormula = (competency: string, value: string) => {
    setEditedConfig((prev: any) => ({
      ...prev,
      competency_formulas: {
        ...prev.competency_formulas,
        [competency]: value,
      },
    }));
  };

  const updateAIPrompt = (key: string, value: string) => {
    setEditedConfig((prev: any) => ({
      ...prev,
      ai_prompts: {
        ...prev.ai_prompts,
        [key]: value,
      },
    }));
  };

  const renderGameConfig = () => {
    if (loading || !editedConfig) {
      return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Final Weights */}
        {editedConfig.final_weights && (
          <div className="space-y-2">
            <h3 className="font-semibold">Final Weights</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(editedConfig.final_weights).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={value as number}
                    onChange={(e) => updateFinalWeight(key, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competency Formulas */}
        {editedConfig.competency_formulas && (
          <div className="space-y-2">
            <h3 className="font-semibold">Competency Formulas</h3>
            <p className="text-xs text-muted-foreground">
              Edit the mathematical formulas used to calculate each competency score
            </p>
            <div className="space-y-3">
              {Object.entries(editedConfig.competency_formulas).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Textarea
                    value={value as string}
                    onChange={(e) => updateFormula(key, e.target.value)}
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Prompts */}
        {editedConfig.ai_prompts && (
          <div className="space-y-2">
            <h3 className="font-semibold">AI Prompts</h3>
            <p className="text-xs text-muted-foreground">
              Configure the prompts used for AI-based scoring
            </p>
            <div className="space-y-3">
              {Object.entries(editedConfig.ai_prompts).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Textarea
                    value={value as string}
                    onChange={(e) => updateAIPrompt(key, e.target.value)}
                    rows={4}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {editedConfig.settings && (
          <div className="space-y-2">
            <h3 className="font-semibold">Settings</h3>
            <div className="space-y-2">
              {Object.entries(editedConfig.settings).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-2 items-center">
                  <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value as any}
                    onChange={(e) => setEditedConfig((prev: any) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        [key]: typeof value === 'number' ? parseFloat(e.target.value) : e.target.value,
                      },
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variables Reference */}
        {editedConfig.variables && (
          <div className="space-y-2">
            <h3 className="font-semibold">Available Variables</h3>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono">
                {editedConfig.variables.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Scoring Controls</DialogTitle>
          <DialogDescription>
            Modify scoring formulas, weights, and AI prompts. Changes will create a new version.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GameType)} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="mental_math_sprint">Mental Math</TabsTrigger>
            <TabsTrigger value="stroop_test">Stroop Test</TabsTrigger>
            <TabsTrigger value="sign_sudoku">Sign Sudoku</TabsTrigger>
            <TabsTrigger value="face_name_match">Face-Name</TabsTrigger>
            <TabsTrigger value="card_flip_challenge">Card Flip</TabsTrigger>
            <TabsTrigger value="scenario_challenge">Scenario</TabsTrigger>
            <TabsTrigger value="ai_debate">Debate</TabsTrigger>
            <TabsTrigger value="creative_uses">Creative Uses</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value={activeTab}>
              {renderGameConfig()}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save New Version'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
