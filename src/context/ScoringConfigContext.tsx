"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScoringConfig } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/config';
import { getActiveScoringVersion, GameType, saveNewScoringVersion } from '@/lib/supabase';

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
          const version = await getActiveScoringVersion(gameType);
          configs[gameType] = version.config;
        } catch (error) {
          console.warn(`No active version for ${gameType}, using defaults`);
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
      const version = await getActiveScoringVersion(gameType);
      setConfig((prev: any) => ({
        ...prev,
        [gameType]: version.config,
      }));
      return version.config;
    } catch (error) {
      console.error(`Failed to load config for ${gameType}:`, error);
      throw error;
    }
  };

  const updateConfig = async (gameType: GameType, newConfig: any, description?: string) => {
    try {
      await saveNewScoringVersion(gameType, newConfig, description);
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
