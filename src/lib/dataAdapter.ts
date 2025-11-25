// src/lib/dataAdapter.ts
import type { CandleData } from '@/store/MarketStore';
import { calculateRSI } from './indicators/calculateRSI';
import { calculateMACD } from './indicators/calculateMACD';
import { calculateEMA } from './indicators/calculateEMA';
import { calculateSMA } from './indicators/calculateSMA';
import { calculateBollinger } from './indicators/calculateBollingerBands';
import { calculateVWAP } from './indicators/calculateVWAP';
import { calculateATR } from './indicators/calculateATR';
import { calculateStochastic } from './indicators/calculateStochastic';
import { calculateADX } from './indicators/calculateADX';
import { calculateParabolicSAR } from './indicators/calculateParabolicSAR';
import { calculateSupertrend } from './indicators/calculateSupertrend';
import { calculateVolume } from './indicators/calculateVolume';


/**
 * Normalizes Alpaca / REST bar objects or any similar structure to CandleData
 */
export const normalizeCandle = (candle: any): CandleData => {
  // Accept either { t,o,h,l,c,v } or { time, open, high, low, close, volume }
  if (candle.t && candle.o !== undefined) {
    return {
      time: typeof candle.t === 'number' ? new Date(candle.t).toISOString() : candle.t,
      open: Number(candle.o),
      high: Number(candle.h),
      low: Number(candle.l),
      close: Number(candle.c),
      volume: candle.v ?? candle.volume ?? 0,
    };
  }
  return {
    time: candle.time ?? new Date().toISOString(),
    open: Number(candle.open ?? candle.o ?? 0),
    high: Number(candle.high ?? candle.h ?? 0),
    low: Number(candle.low ?? candle.l ?? 0),
    close: Number(candle.close ?? candle.c ?? 0),
    volume: Number(candle.volume ?? candle.v ?? 0),
  };
};

/**
 * Merge arrays of candles uniquely by ISO time
 */
export const mergeCandles = (existing: CandleData[], incoming: CandleData[]) => {
  const map = new Map<string, CandleData>();
  for (const c of existing) map.set(c.time, c);
  for (const c of incoming) map.set(c.time, c);
  const arr = Array.from(map.values()).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return arr;
};

/**
 * Adapter map to compute indicators from CandleData[] (most indicator functions expect numeric arrays).
 * Returns an object keyed by indicator name.
 */
export const computeIndicators = (candles: CandleData[], activeIndicators: string[]) => {
  const results: Record<string, any> = {};
  const ctx = { candles };

  if (!candles || candles.length === 0) return results;

  // convenience arrays
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const vols = candles.map(c => c.volume ?? 0);

  for (const name of activeIndicators) {
   try {
  switch (name) {
    case 'rsi': {
      const closes = candles.map(c => c.close);
      results.rsi = calculateRSI(closes, 14);
      break;
    }
        case 'macd':
          results.macd = calculateMACD(candles);
          break;
        case 'ema':
          results.ema = calculateEMA(candles);
          break;
        case 'sma':
          results.sma = calculateSMA(candles);
          break;
        case 'bollinger':
          results.bollinger = calculateBollinger(candles);
          break;
        case 'vwap':
          results.vwap = calculateVWAP(candles);
          break;
        case 'atr':
          results.atr = calculateATR(candles);
          break;
        case 'stochastic':
          results.stochastic = calculateStochastic(candles);
          break;
        case 'adx': {
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => ({ close: c.close }));

        results.adx = calculateADX(highs, lows, closes, 14);
        break;
        }

        case 'parabolic':
          results.parabolic = calculateParabolicSAR(candles);
          break;
        case 'supertrend':
          results.supertrend = calculateSupertrend(candles);
          break;
        case 'volume':
          results.volume = calculateVolume(candles);
          break;
        default:
          // not implemented
          results[name] = null;
      }
    } catch (err) {
      console.error(`Indicator ${name} computation error:`, err);
      results[name] = null;
    }
  }

  return results;
};

export const prepareChartData = (candles: CandleData[], activeIndicators: string[]) => {
  const indicators = computeIndicators(candles, activeIndicators);
  return { candles, indicators };
};
