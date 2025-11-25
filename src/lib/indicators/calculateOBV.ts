// src/lib/indicators/calculateOBV.ts
/**
 * calculateOBV
 * On-Balance Volume (OBV) indicator
 * @param closes - array of closing prices
 * @param volumes - array of corresponding volumes
 * @returns array of OBV values
 */
export function calculateOBV(closes: number[], volumes: number[]): number[] {
  if (closes.length !== volumes.length) {
    throw new Error('calculateOBV: closes and volumes arrays must have the same length');
  }

  const obv: number[] = [];
  let runningTotal = 0;

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      // First OBV value starts at 0
      obv.push(0);
      continue;
    }

    if (closes[i] > closes[i - 1]) {
      runningTotal += volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      runningTotal -= volumes[i];
    }
    // If closes[i] === closes[i-1], OBV stays the same

    obv.push(runningTotal);
  }

  return obv;
}
