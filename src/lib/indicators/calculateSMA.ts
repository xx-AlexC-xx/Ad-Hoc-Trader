// src/lib/indicators/calculateSMA.ts
export function calculateSMAFromValues(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out.push(sum / period);
    else out.push(null);
  }
  return out;
}

// adapter for CandleData[] -> SMA
export function calculateSMA(candles: { close: number }[], period = 14) {
  const values = candles.map(c => c.close);
  return calculateSMAFromValues(values, period);
}
