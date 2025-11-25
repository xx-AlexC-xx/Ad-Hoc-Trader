// src/lib/indicators/calculateStochastic.ts
export function calculateStochastic(candles: { high: number; low: number; close: number }[], kPeriod = 14, dPeriod = 3) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  const k: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) { k.push(null); continue; }
    const sliceHigh = highs.slice(i - kPeriod + 1, i + 1);
    const sliceLow = lows.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...sliceHigh);
    const lowest = Math.min(...sliceLow);
    const val = highest === lowest ? 0 : ((closes[i] - lowest) / (highest - lowest)) * 100;
    k.push(val);
  }

  const d: (number | null)[] = [];
  for (let i = 0; i < k.length; i++) {
    if (i < dPeriod - 1) { d.push(null); continue; }
    const slice = k.slice(i - dPeriod + 1, i + 1).map(v => v ?? 0);
    d.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  return { k, d };
}
