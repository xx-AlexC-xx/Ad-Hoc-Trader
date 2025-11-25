// src/lib/indicators/calculateParabolicSAR.ts
export function calculateParabolicSAR(candles: { high: number; low: number }[], step = 0.02, maxStep = 0.2) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const sar: (number | null)[] = [];
  let isLong = true;
  let af = step;
  let ep = highs[0];
  let priorSar = lows[0];

  for (let i = 0; i < highs.length; i++) {
    if (i === 0) { sar.push(null); continue; }
    const high = highs[i], low = lows[i];
    let nextSar = priorSar + af * (ep - priorSar);
    if (isLong) {
      if (low <= nextSar) {
        isLong = false;
        nextSar = ep;
        af = step;
        ep = low;
      } else {
        if (high > ep) { ep = high; af = Math.min(maxStep, af + step); }
      }
    } else {
      if (high >= nextSar) {
        isLong = true;
        nextSar = ep;
        af = step;
        ep = high;
      } else {
        if (low < ep) { ep = low; af = Math.min(maxStep, af + step); }
      }
    }
    sar.push(nextSar);
    priorSar = nextSar;
  }
  return sar;
}
