// src/lib/indicators/calculateVWAP.ts
export function calculateVWAP(candles: { close: number; volume?: number }[]) {
  const vwap: (number | null)[] = [];
  let cumPV = 0;
  let cumV = 0;
  for (let i = 0; i < candles.length; i++) {
    const p = candles[i].close ?? 0;
    const v = candles[i].volume ?? 0;
    cumPV += p * v;
    cumV += v;
    vwap.push(cumV === 0 ? null : cumPV / cumV);
  }
  return vwap;
}
