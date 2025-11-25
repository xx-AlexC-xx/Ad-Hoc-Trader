// src/lib/indicators/calculateADX.ts

/**
 * calculateADX
 * Computes the Average Directional Index (ADX) along with DI+ and DI-
 * @param highs - array of high prices
 * @param lows - array of low prices
 * @param closes - array of objects with { close: number }
 * @param period - period for calculation
 * @returns object containing arrays: { adx, diPlus, diMinus }
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: { close: number }[],
  period = 14
) {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { 
      plusDM.push(0); 
      minusDM.push(0); 
      tr.push(0); 
      continue; 
    }
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        highs[i] - lows[i], 
        Math.abs(highs[i] - closes[i - 1].close), 
        Math.abs(lows[i] - closes[i - 1].close)
      )
    );
  }

  const smPlus: (number | null)[] = [];
  const smMinus: (number | null)[] = [];
  const smTR: (number | null)[] = [];

  for (let i = 0; i < plusDM.length; i++) {
    if (i < period) { 
      smPlus.push(null); 
      smMinus.push(null); 
      smTR.push(null); 
      continue; 
    }
    const plus = plusDM.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const minus = minusDM.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const atr = tr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    smPlus.push(plus); 
    smMinus.push(minus); 
    smTR.push(atr);
  }

  const diPlus = smPlus.map((v, i) => (v === null || smTR[i] === null ? null : 100 * (v as number) / (smTR[i] as number)));
  const diMinus = smMinus.map((v, i) => (v === null || smTR[i] === null ? null : 100 * (v as number) / (smTR[i] as number)));
  const dx = diPlus.map((p, i) => (p === null || diMinus[i] === null ? null : 100 * Math.abs((p as number) - (diMinus[i] as number)) / ((p as number) + (diMinus[i] as number))));
  const adx: (number | null)[] = [];

  for (let i = 0; i < dx.length; i++) {
    if (i < period || dx[i] === null) { 
      adx.push(null); 
      continue; 
    }
    const slice = dx.slice(i - period + 1, i + 1).map(v => v ?? 0);
    adx.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  return { adx, diPlus, diMinus };
}
