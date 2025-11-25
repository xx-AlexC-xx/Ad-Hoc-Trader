// src/lib/indicators/calculateEMA.ts
export function calculateEMAFromValues(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (i === period - 1) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      out.push(seed);
      continue;
    }
    if (prev === null) {
      out.push(null);
      continue;
    }
    const ema = (v - prev) * k + prev;
    out.push(ema);
    prev = ema;
  }
  return out;
}

export function calculateEMA(candles: { close: number }[], period = 14) {
  const values = candles.map(c => c.close);
  return calculateEMAFromValues(values, period);
}
