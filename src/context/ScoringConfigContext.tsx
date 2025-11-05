"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScoringConfig } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/lib/config';

interface ScoringConfigContextType {
  config: ScoringConfig;
  updateConfig: (newConfig: ScoringConfig) => void;
  resetConfig: () => void;
  isLoaded: boolean;
}

const ScoringConfigContext = createContext<ScoringConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'neurazor-scoring-config';

export function ScoringConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
        console.log('Loaded scoring config from localStorage');
      }
    } catch (error) {
      console.error('Failed to load scoring config from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save config to localStorage whenever it changes
  const updateConfig = (newConfig: ScoringConfig) => {
    try {
      setConfig(newConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      console.log('Saved scoring config to localStorage');
    } catch (error) {
      console.error('Failed to save scoring config to localStorage:', error);
    }
  };

  // Reset to default configuration
  const resetConfig = () => {
    try {
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      console.log('Reset scoring config to default');
    } catch (error) {
      console.error('Failed to reset scoring config:', error);
    }
  };

  return (
    <ScoringConfigContext.Provider value={{ config, updateConfig, resetConfig, isLoaded }}>
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
