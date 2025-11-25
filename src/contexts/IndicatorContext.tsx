import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useIndicators } from '@/hooks/useIndicators';

interface IndicatorContextValue {
  indicators: ReturnType<typeof useIndicators>['indicators'];
  candles: ReturnType<typeof useIndicators>['candles'];
  symbol: string;
  updateSymbol: (s: string) => void;
  loading: boolean;
  error?: string | null;
}

// --- Create context ---
const IndicatorContext = createContext<IndicatorContextValue | undefined>(undefined);

// --- Provider ---
export const IndicatorProvider: React.FC<{ symbol?: string; children: ReactNode }> = ({
  symbol = 'AAPL',
  children,
}) => {
  const { indicators, candles, updateSymbol, loading, error } = useIndicators(symbol);

  const value: IndicatorContextValue = {
    indicators,
    candles,
    symbol,
    updateSymbol,
    loading,
    error,
  };

  return (
    <IndicatorContext.Provider value={value}>
      {children}
    </IndicatorContext.Provider>
  );
};

// --- Hook for components to consume context easily ---
export const useIndicatorContext = (): IndicatorContextValue => {
  const context = useContext(IndicatorContext);
  if (!context) {
    throw new Error('useIndicatorContext must be used inside an <IndicatorProvider>');
  }
  return context;
};
