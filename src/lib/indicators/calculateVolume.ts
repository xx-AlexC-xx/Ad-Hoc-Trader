// src/lib/indicators/calculateVolume.ts
export function calculateVolume(
  data: ({ volume?: number } | { v?: number })[]
): number[] {
  return data.map((item) => {
    const vol =
      'volume' in item
        ? item.volume
        : 'v' in item
        ? (item.v as number)
        : undefined;
    return vol ?? 0;
  });
}

export default calculateVolume;
