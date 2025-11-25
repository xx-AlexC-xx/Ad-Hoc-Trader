// src/lib/indicators/calculateSupertrend.ts
import { calculateATR } from './calculateATR';

export function calculateSupertrend(candles: { high: number; low: number; close: number }[], period = 10, multiplier = 3) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const atr = calculateATR(candles, period);
  const finalUpper: (number | null)[] = [];
  const finalLower: (number | null)[] = [];
  const trend: (1 | -1 | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (atr[i] === null) { finalUpper.push(null); finalLower.push(null); trend.push(null); continue; }
    const hl2 = (highs[i] + lows[i]) / 2;
    const upper = hl2 + (multiplier * (atr[i] as number));
    const lower = hl2 - (multiplier * (atr[i] as number));
    if (i === 0) { finalUpper.push(upper); finalLower.push(lower); trend.push(1); continue; }
    const prevUpper = finalUpper[i - 1];
    const prevLower = finalLower[i - 1];
    let fUpper = upper;
    let fLower = lower;
    if (prevUpper !== null && upper < prevUpper) fUpper = prevUpper;
    if (prevLower !== null && lower > prevLower) fLower = prevLower;
    finalUpper.push(fUpper);
    finalLower.push(fLower);
    const prevTrend = trend[i - 1] ?? 1;
    let currTrend = prevTrend;
    if (prevTrend === 1) {
      if (closes[i] < fUpper) currTrend = -1;
      else currTrend = 1;
    } else {
      if (closes[i] > fLower) currTrend = 1;
      else currTrend = -1;
    }
    trend.push(currTrend);
  }
  return { finalUpper, finalLower, trend };
}
