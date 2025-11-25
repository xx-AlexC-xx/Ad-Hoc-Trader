// src/lib/indicators/calculateBollinger.ts
export function calculateBollingerFromValues(values: number[], period = 20, dev = 2) {
  const middle: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      middle.push(null); upper.push(null); lower.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(mean);
    upper.push(mean + dev * sd);
    lower.push(mean - dev * sd);
  }
  return { middle, upper, lower };
}

export function calculateBollinger(candles: { close: number }[], period = 20, dev = 2) {
  const values = candles.map(c => c.close);
  return calculateBollingerFromValues(values, period, dev);
}
