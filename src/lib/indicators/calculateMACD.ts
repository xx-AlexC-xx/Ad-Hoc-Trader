// src/lib/indicators/calculateMACD.ts
import { calculateEMAFromValues } from './calculateEMA';

export function calculateMACDFromValues(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMAFromValues(values, fast);
  const emaSlow = calculateEMAFromValues(values, slow);
  const macd: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    macd.push(f === null || s === null ? null : (f - s));
  }
  const signalLine = calculateEMAFromValues(macd.map(v => v ?? 0), signal);
  const hist = macd.map((m, i) => (m === null || signalLine[i] === null ? null : (m - (signalLine[i] as number))));
  return { macd, signal: signalLine, histogram: hist };
}

export function calculateMACD(candles: { close: number }[], fast = 12, slow = 26, signal = 9) {
  const values = candles.map(c => c.close);
  return calculateMACDFromValues(values, fast, slow, signal);
}
