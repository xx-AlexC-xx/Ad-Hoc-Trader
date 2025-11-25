/**
 * calculateRSI.ts
 *
 * Computes the Relative Strength Index (RSI) for a series of numeric values
 * using Wilder's smoothing method.
 *
 * Returns an array of length === values.length where the first `period` entries
 * are null (no RSI available) and subsequent entries are numbers between 0-100.
 */

export function calculateRSI(values: number[], period = 14): (number | null)[] {
  if (!Array.isArray(values)) {
    throw new TypeError('values must be an array of numbers');
  }

  const n = values.length;
  // If not enough values to compute even a single RSI, return array of nulls
  if (n === 0) return [];
  if (n < period + 1) {
    // cannot compute a single RSI value (need period + 1 points to compute initial avg)
    return Array(n).fill(null);
  }

  // Output array: first `period` entries are null (no RSI)
  const out: (number | null)[] = Array(period).fill(null);

  // Compute initial gains/losses over the first `period` differences (i from 1 to period)
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  }

  // Initial average gain / loss
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // First RSI value corresponds to index `period` in values
  const firstRS = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  const firstRSI = avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRS);
  out.push(Number.isFinite(firstRSI) ? firstRSI : null);

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < n; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    // Wilder smoothing: avg = (previous_avg * (period - 1) + current) / period
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    let rsi: number | null;
    if (avgLoss === 0) {
      rsi = 100; // no losses -> RSI 100
    } else {
      const rs = avgGain / avgLoss;
      rsi = 100 - 100 / (1 + rs);
    }

    out.push(rsi);
  }

  return out;
}

export default calculateRSI;
