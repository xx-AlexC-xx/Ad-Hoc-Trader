// src/lib/indicators/calculateATR.ts

/**
 * calculateATRFromValues
 * Computes the Average True Range (ATR) from arrays of highs, lows, and closes
 * @param highs - array of high prices
 * @param lows - array of low prices
 * @param closes - array of objects with { close: number }
 * @param period - ATR period
 * @returns array of ATR values (number | null)
 */
export function calculateATRFromValues(
  highs: number[],
  lows: number[],
  closes: { close: number }[],
  period = 14
) {
  const trs: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trs.push(highs[i] - lows[i]);
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1].close),
        Math.abs(lows[i] - closes[i - 1].close)
      );
      trs.push(tr);
    }
  }

  const atrs: (number | null)[] = [];
  let prevAtr: number | null = null;

  for (let i = 0; i < trs.length; i++) {
    if (i < period) {
      atrs.push(null);
      continue;
    }
    if (i === period) {
      const sum = trs.slice(1, period + 1).reduce((a, b) => a + b, 0);
      prevAtr = sum / period;
      atrs.push(prevAtr);
      continue;
    }
    if (prevAtr === null) {
      atrs.push(null);
      continue;
    }
    prevAtr = (prevAtr * (period - 1) + trs[i]) / period;
    atrs.push(prevAtr);
  }

  return atrs;
}

/**
 * calculateATR
 * Convenience wrapper to extract highs, lows, and closes from candles
 * @param candles - array of candle objects with { high, low, close }
 * @param period - ATR period
 * @returns array of ATR values (number | null)
 */
export function calculateATR(
  candles: { high: number; low: number; close: number }[],
  period = 14
) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => ({ close: c.close }));
  return calculateATRFromValues(highs, lows, closes, period);
}
