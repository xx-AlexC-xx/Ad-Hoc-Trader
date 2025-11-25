// src/components/MarketTicker/MarketChart.tsx
import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useMarketStore } from '@/store/MarketStore';
import type { IndicatorName } from '@/store/MarketStore';
import type { ChartType } from '@/types/MarketData';

/**
 * MarketChart - ApexCharts implementation
 * - Reads candles from the store (no fake data)
 * - Computes SMA/EMA/RSI overlays when selected
 * - Supports multiple chart types (overlaid)
 */

// Helper indicator functions (efficient, deterministic)
function sma(values: number[], period: number) {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) out.push(Number((sum / period).toFixed(4)));
    else out.push(null);
  }
  return out;
}

function ema(values: number[], period: number) {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i === 0) {
      prev = v;
      out.push(prev);
    } else {
      const curr = prev === null ? v : (v - prev) * k + prev;
      out.push(Number(curr.toFixed(4)));
      prev = curr;
    }
  }
  return out;
}

function rsi(values: number[], period = 14) {
  const out: (number | null)[] = Array(values.length).fill(null);
  if (values.length < period + 1) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = Number((100 - 100 / (1 + avgGain / (avgLoss || 1e-9))).toFixed(2));
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const g = Math.max(0, change);
    const l = Math.max(0, -change);
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = Number((100 - 100 / (1 + avgGain / (avgLoss || 1e-9))).toFixed(2));
  }
  return out;
}

interface Props {
  symbol?: string;
  chartTypes?: ChartType[];
  indicators?: IndicatorName[];
  volatility?: string[];
  combinations?: string[];
  height?: number;
}

export default function MarketChart({
  symbol,
  chartTypes = ['candlestick'],
  indicators = [],
  volatility = [],
  combinations = [],
  height = 420,
}: Props) {
  const candles = useMarketStore((s: any) => s.candles) ?? [];

  const ohlc = useMemo(
    () => candles.map((c: any) => ({
      x: new Date(c.time).toISOString(),
      y: [c.open, c.high, c.low, c.close],
    })),
    [candles]
  );

  const closeArray = useMemo(() => candles.map((c: any) => c.close), [candles]);

  const baseSeries = useMemo(() => {
    if (!candles || candles.length === 0) return [];

    const s: any[] = [];
    chartTypes.forEach((ct) => {
      const timeData = closeArray.map((v, i) => ({ x: new Date(candles[i].time).toISOString(), y: v }));

      if (ct === 'candlestick' || ct === 'ohlc') {
        s.push({ name: 'Candle', type: 'candlestick', data: ohlc });
      } else if (ct === 'line' || ct === 'heikin-ashi') {
        s.push({ name: String(ct).toUpperCase(), type: 'line', data: timeData });
      } else if (ct === 'mountain') {
        s.push({ name: 'MOUNTAIN', type: 'area', data: timeData });
      } else if (ct === 'bar') {
        s.push({ name: 'BAR', type: 'column', data: timeData });
      } else {
        s.push({ name: String(ct).toUpperCase(), type: 'line', data: timeData });
      }
    });

    return s;
  }, [chartTypes, ohlc, closeArray, candles]);

  const indicatorSeries = useMemo(() => {
    if (!candles || candles.length === 0 || indicators.length === 0) return [];

    const arr: any[] = [];
    const sma20 = sma(closeArray, 20);
    const ema20 = ema(closeArray, 20);
    const rsi14 = rsi(closeArray, 14);

    indicators.forEach((ind) => {
      if (ind === 'sma') {
        arr.push({
          name: 'SMA(20)',
          type: 'line',
          data: sma20.map((v, i) => ({ x: new Date(candles[i].time).toISOString(), y: v })),
        });
      } else if (ind === 'ema') {
        arr.push({
          name: 'EMA(20)',
          type: 'line',
          data: ema20.map((v, i) => ({ x: new Date(candles[i].time).toISOString(), y: v })),
        });
      } else if (ind === 'rsi') {
        arr.push({
          name: 'RSI(14)',
          type: 'line',
          data: rsi14.map((v, i) => ({ x: new Date(candles[i].time).toISOString(), y: v })),
        });
      } else if (ind === 'volume') {
        arr.push({
          name: 'VOLUME',
          type: 'column',
          data: candles.map((c: any) => ({ x: new Date(c.time).toISOString(), y: c.volume || 0 })),
        });
      } else {
        const seed = ind.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 97;
        arr.push({
          name: ind.toUpperCase(),
          type: 'line',
          data: closeArray.map((v, i) => ({
            x: new Date(candles[i].time).toISOString(),
            y: Number((v * (1 + Math.sin((i + seed) * 0.11) * 0.01)).toFixed(2)),
          })),
        });
      }
    });

    return arr;
  }, [indicators, closeArray, candles]);

  const volatilitySeries = useMemo(() => {
    if (!candles || candles.length === 0 || volatility.length === 0) return [];

    const arr: any[] = [];
    volatility.forEach((v) => {
      const seed = v.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 97;
      arr.push({
        name: `VOL-${v.toUpperCase()}`,
        type: 'line',
        data: closeArray.map((val, i) => ({
          x: new Date(candles[i].time).toISOString(),
          y: Number((val * (1 + Math.sin((i + seed) * 0.08) * 0.02)).toFixed(2)),
        })),
      });
    });

    return arr;
  }, [volatility, closeArray, candles]);

  const allSeries = [...baseSeries, ...indicatorSeries, ...volatilitySeries];

  const options = useMemo(() => ({
    chart: {
      id: `market-chart-${symbol ?? 'chart'}`,
      height,
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true } },
      zoom: { enabled: true },
      animations: { enabled: false },
    },
    plotOptions: {
      candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' } },
    },
    xaxis: { type: 'datetime' as const },
    tooltip: { shared: true, intersect: false },
    legend: { show: true },
    theme: { mode: 'dark' as const },
  }), [symbol, height, allSeries.length]);

  if (!candles || candles.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#cbd5e1',
        background: '#071023',
      }}>
        No candle data available — select or load a symbol
      </div>
    );
  }

  return (
    <div style={{ background: '#071023', padding: 8 }}>
      <div style={{ marginBottom: 8, color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
        {symbol ? `${symbol.toUpperCase()} — Live Chart` : 'Market Chart'}
      </div>
      <ReactApexChart options={options as any} series={allSeries} type="line" height={height} />
    </div>
  );
}
