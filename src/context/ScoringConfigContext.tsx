"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScoringConfig } from '@/lib/types';
import { loadActiveGameConfig, saveNewGameConfig } from '@/lib/api';

export type GameType = 
  | 'mental_math_sprint'
  | 'face_name_match'
  | 'sign_sudoku'
  | 'stroop_test'
  | 'card_flip_challenge'
  | 'scenario_challenge'
  | 'ai_debate'
  | 'creative_uses'
  | 'statement_reasoning'
  | 'vocab_challenge'
  | 'lucky_flip';

interface ScoringConfigContextType {
  config: any; // Config from active versions
  updateConfig: (gameType: GameType, newConfig: any, description?: string) => Promise<void>;
  loadGameConfig: (gameType: GameType) => Promise<any>;
  isLoaded: boolean;
}

const ScoringConfigContext = createContext<ScoringConfigContextType | undefined>(undefined);

export function ScoringConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<any>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const getDefaultConfig = (gameType: GameType) => {
    const defaults: Record<GameType, any> = {
      mental_math_sprint: {
        final_weights: { accuracy: 0.4, speed: 0.3, quantitative_aptitude: 0.2, mental_stamina: 0.1 },
        competency_formulas: {},
        settings: { accuracy_mode: 'binary', time_limit: 5 },
        variables: []
      },
      stroop_test: {
        final_weights: { cognitive_flexibility: 0.4, cognitive_agility: 0.3, accuracy: 0.2, speed: 0.1 },
        competency_formulas: {},
        settings: {},
        variables: []
      },
      sign_sudoku: {
        final_weights: { accuracy: 0.3, reasoning: 0.3, attention_to_detail: 0.2, speed: 0.1, math: 0.1 },
        competency_formulas: {},
        settings: {},
        variables: []
      },
      face_name_match: {
        final_weights: { memory: 0.4, accuracy: 0.3, speed: 0.3 },
        competency_formulas: {},
        settings: {},
        variables: []
      },
      card_flip_challenge: {
        final_weights: { pattern_recognition: 0.4, reasoning: 0.3, strategy: 0.2, speed: 0.1 },
        competency_formulas: {},
        settings: {},
        variables: []
      },
      scenario_challenge: {
        final_weights: { reasoning: 0.3, decision_making: 0.3, empathy: 0.2, creativity: 0.1, communication: 0.1 },
        competency_formulas: {},
        ai_prompts: {},
        settings: {},
        variables: []
      },
      ai_debate: {
        final_weights: { reasoning: 0.4, holistic_analysis: 0.3, cognitive_agility: 0.2, communication: 0.1 },
        competency_formulas: {},
        ai_prompts: {},
        settings: {},
        variables: []
      },
      creative_uses: {
        final_weights: { creativity: 0.7, speed: 0.3 },
        competency_formulas: {},
        ai_prompts: {},
        settings: {},
        variables: []
      },
      statement_reasoning: {
        final_weights: { reasoning: 0.5, communication: 0.3, creativity: 0.2 },
        competency_formulas: {},
        ai_prompts: {},
        settings: {},
        variables: []
      },
      vocab_challenge: {
        final_weights: { vocabulary: 0.6, speed: 0.4 },
        competency_formulas: {},
        settings: {},
        variables: []
      },
      lucky_flip: {
        final_weights: { risk_appetite: 0.4, drive: 0.3, reasoning: 0.3 },
        competency_formulas: {},
        ai_prompts: {},
        settings: {},
        variables: []
      }
    };
    return defaults[gameType] || { final_weights: {}, competency_formulas: {}, settings: {}, variables: [] };
  };

  // Load all active configs on mount
  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    try {
      const gameTypes: GameType[] = [
        'mental_math_sprint',
        'face_name_match',
        'sign_sudoku',
        'stroop_test',
        'card_flip_challenge',
        'scenario_challenge',
        'ai_debate',
        'creative_uses',
      ];

      const configs: any = {};
      for (const gameType of gameTypes) {
        try {
          const versionConfig = await loadActiveGameConfig(gameType);
          configs[gameType] = versionConfig;
        } catch (error) {
          console.warn(`No active version for ${gameType}, using defaults`);
          configs[gameType] = getDefaultConfig(gameType);
        }
      }
      
      setConfig(configs);
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load configs from Supabase:', error);
      setIsLoaded(true);
    }
  };

  const loadGameConfig = async (gameType: GameType) => {
    try {
      const versionConfig = await loadActiveGameConfig(gameType);
      setConfig((prev: any) => ({
        ...prev,
        [gameType]: versionConfig,
      }));
      return versionConfig;
    } catch (error) {
      console.error(`Failed to load config for ${gameType}:`, error);
      const defaultConfig = getDefaultConfig(gameType);
      setConfig((prev: any) => ({
        ...prev,
        [gameType]: defaultConfig,
      }));
      return defaultConfig;
    }
  };

  const updateConfig = async (gameType: GameType, newConfig: any, description?: string) => {
    try {
      await saveNewGameConfig(gameType, newConfig, description);
      setConfig((prev: any) => ({
        ...prev,
        [gameType]: newConfig,
      }));
      console.log(`Saved new version for ${gameType}`);
    } catch (error) {
      console.error(`Failed to save config for ${gameType}:`, error);
      throw error;
    }
  };

  return (
    <ScoringConfigContext.Provider value={{ config, updateConfig, loadGameConfig, isLoaded }}>
      {children}
    </ScoringConfigContext.Provider>
  );
}

export function useScoringConfig() {
  const context = useContext(ScoringConfigContext);
  if (context === undefined) {
    throw new Error('useScoringConfig must be used within a ScoringConfigProvider');
  }
  return context;
}
