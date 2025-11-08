import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { loadActiveGameConfig, saveNewGameConfig } from '@/lib/api'; // Updated import

interface ScoringConfig {
  // Define the structure of your config object
  [key: string]: any;
}

interface ScoringConfigContextType {
  config: ScoringConfig | null;
  loading: boolean;
  error: string | null;
  loadGameConfig: (gameType: string) => Promise<void>;
  updateConfig: (gameType: string, newConfig: ScoringConfig, description: string, userId: string) => Promise<void>;
}

const ScoringConfigContext = createContext<ScoringConfigContextType | undefined>(undefined);

export const ScoringConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadGameConfig = useCallback(async (gameType: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeConfig = await loadActiveGameConfig(gameType);
      setConfig(activeConfig);
    } catch (err) {
      console.error('Failed to load game config:', err);
      setError('Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (gameType: string, newConfig: ScoringConfig, description: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await saveNewGameConfig(gameType, newConfig, description, userId);
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