import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { loadActiveGameConfig, saveNewGameConfig } from '@/lib/api'; // Updated import

interface ScoringConfig {
  // Define the structure of your config object
  [key: string]: any;
}

export type GameType = 
  | 'mental_math_sprint'
  | 'stroop_test'
  | 'sign_sudoku'
  | 'face_name_match'
  | 'card_flip_challenge'
  | 'scenario_challenge'
  | 'ai_debate'
  | 'creative_uses';

interface ScoringConfigContextType {
  config: Record<GameType, ScoringConfig | null>;
  loading: boolean;
  error: string | null;
  loadGameConfig: (gameType: GameType) => Promise<ScoringConfig>;
  updateConfig: (gameType: GameType, newConfig: ScoringConfig, description?: string, userId?: string) => Promise<void>;
}

const ScoringConfigContext = createContext<ScoringConfigContextType | undefined>(undefined);

export const ScoringConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Record<GameType, ScoringConfig | null>>({} as Record<GameType, ScoringConfig | null>);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadGameConfig = useCallback(async (gameType: GameType): Promise<ScoringConfig> => {
    setLoading(true);
    setError(null);
    try {
      const activeConfig = await loadActiveGameConfig(gameType);
      setConfig(prev => ({ ...prev, [gameType]: activeConfig }));
      return activeConfig;
    } catch (err) {
      console.error('Failed to load game config:', err);
      setError('Failed to load configuration.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (gameType: GameType, newConfig: ScoringConfig, description?: string, userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use test user ID if not provided
      const userIdToUse = userId || '53f77b43-d71a-4edf-8b80-c70b975264d8';
      await saveNewGameConfig(gameType, newConfig, description, userIdToUse);
      // After saving, reload the latest active config to reflect changes
      await loadGameConfig(gameType);
    } catch (err) {
      console.error('Failed to update game config:', err);
      setError('Failed to save configuration.');
      throw err; // Re-throw to be caught in the modal
    } finally {
      setLoading(false);
    }
  }, [loadGameConfig]);

  return (
    <ScoringConfigContext.Provider value={{ config, loading, error, loadGameConfig, updateConfig }}>
      {children}
    </ScoringConfigContext.Provider>
  );
};

export const useScoringConfig = () => {
  const context = useContext(ScoringConfigContext);
  if (context === undefined) {
    throw new Error('useScoringConfig must be used within a ScoringConfigProvider');
  }
  return context;
};