// src/hooks/useIndicators.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { createAlpacaClient } from '@/lib/alpacaClient';

// === Indicator Imports ===
import { calculateRSI } from '@/lib/indicators/calculateRSI';
import { calculateEMA } from '@/lib/indicators/calculateEMA';
import { calculateSMA } from '@/lib/indicators/calculateSMA';
import { calculateMACD } from '@/lib/indicators/calculateMACD';
import { calculateVWAP } from '@/lib/indicators/calculateVWAP';
import { calculateBollinger } from '@/lib/indicators/calculateBollingerBands';
import { calculateATR, calculateATRFromValues } from '@/lib/indicators/calculateATR';
import { calculateOBV } from '@/lib/indicators/calculateOBV';
import { calculateADX } from '@/lib/indicators/calculateADX';
import { calculateVolume } from '@/lib/indicators/calculateVolume';

import type { Bar } from '@/types/MarketData';

// === Types ===
export type IndicatorResults = {
  rsi: number[];
  ema: number[];
  sma: number[];
  macd: { macd: number[]; signal: number[]; histogram: number[] };
  vwap: number[];
  bollinger: { upper: number[]; middle: number[]; lower: number[] };
  atr: number[];
  obv: number[];
  adx: number[];
  volume: number[];
};

export interface UseIndicators {
  indicators: IndicatorResults;
  candles: Bar[];
  updateSymbol: (symbol: string) => void;
  loading: boolean;
  error?: string | null;
}

/**
 * Hook: useIndicators
 * Connects to Alpaca, streams live bars, computes all 10 indicators, and exposes them reactively.
 */
export function useIndicators(initialSymbol = 'AAPL'): UseIndicators {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [candles, setCandles] = useState<Bar[]>([]);
  const [indicators, setIndicators] = useState<IndicatorResults>({
    rsi: [],
    ema: [],
    sma: [],
    macd: { macd: [], signal: [], histogram: [] },
    vwap: [],
    bollinger: { upper: [], middle: [], lower: [] },
    atr: [],
    obv: [],
    adx: [],
    volume: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const alpacaClientRef = useRef<ReturnType<typeof createAlpacaClient> | null>(null);

  // === Fetch initial historical bars ===
  const fetchHistorical = useCallback(async () => {
    try {
      setLoading(true);
      const client = alpacaClientRef.current!;
      const bars = await client.fetchBars(symbol, '1Min', 500);
      setCandles(bars);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch historical data:', err);
      setError(err.message ?? 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // === Compute Indicators ===
  const computeIndicators = useCallback((bars: Bar[]) => {
    if (!bars || bars.length === 0) return;

    const closes = bars.map(b => b.c);
    const highs = bars.map(b => b.h);
    const lows = bars.map(b => b.l);
    const volumes = bars.map(b => b.v ?? 0);

    const closesObj = bars.map(b => ({ close: b.c }));
    const barsWithVolume = bars.map(b => ({ close: b.c, volume: b.v ?? 0 }));

    const adxResult = calculateADX(highs, lows, closesObj, 14);
    

    const nextIndicators: IndicatorResults = {
      rsi: calculateRSI(closes, 14),
      ema: calculateEMA(closesObj, 12),
      sma: calculateSMA(closesObj, 20),
      macd: calculateMACD(closesObj),
      vwap: calculateVWAP(barsWithVolume),
      bollinger: calculateBollinger(closesObj, 20),
      atr: calculateATRFromValues(highs, lows, closesObj, 14),
      obv: calculateOBV(closes, volumes),
      adx: adxResult.adx,
      volume: calculateVolume(bars),
    };

    setIndicators(nextIndicators);
  }, []);

  // === Handle live updates from WebSocket ===
  const handleTradeUpdate = useCallback(
    (trade: any) => {
      setCandles(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        const t = new Date(trade.t).toISOString();

        // If trade within current bar minute → update
        if (last && last.t.slice(0, 16) === t.slice(0, 16)) {
          last.c = trade.p;
          last.h = Math.max(last.h, trade.p);
          last.l = Math.min(last.l, trade.p);
          last.v = (last.v ?? 0) + trade.s;
        } else {
          // Start new bar
          next.push({
            t,
            o: trade.p,
            h: trade.p,
            l: trade.p,
            c: trade.p,
            v: trade.s,
          });
          if (next.length > 500) next.shift();
        }

        computeIndicators(next);
        return next;
      });
    },
    [computeIndicators]
  );

  // === Initialize client and subscriptions ===
  useEffect(() => {
    const client = createAlpacaClient();
    alpacaClientRef.current = client;

    fetchHistorical().then(() => {
      client.start({
        onTrade: handleTradeUpdate,
      });
      client.subscribe(symbol);
    });

    return () => {
      client.unsubscribe(symbol);
      client.stop();
    };
  }, [symbol, fetchHistorical, handleTradeUpdate]);

  const updateSymbol = useCallback((sym: string) => {
    setSymbol(sym);
  }, []);

  return { indicators, candles, updateSymbol, loading, error };
}

export default useIndicators;
