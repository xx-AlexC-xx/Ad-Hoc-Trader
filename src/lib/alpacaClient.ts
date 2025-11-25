// src/lib/alpacaClient.ts
// Hybrid client: REST + WebSocket (throttle, reconnection, proxy-ready).
// Dev note: do NOT embed secret keys in production client bundles.

import type { TradeMessage, Bar } from '@/types/MarketData';
import { calculateRSI } from './indicators/calculateRSI';
import { calculateVolume } from './indicators/calculateVolume';
import AlpacaBaseClient from '@alpacahq/alpaca-trade-api';

export type AlpacaClientOptions = {
  mode?: 'auto' | 'direct' | 'proxy';
  restBase?: string;
  wsUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  throttleMs?: number;
};

export function createAlpacaClient(opts: AlpacaClientOptions = {}) {
  const mode = opts.mode ?? 'auto';
  const throttleMs = opts.throttleMs ?? 300;

  // ✅ Patched: no process.env, keys must come from opts (e.g., Supabase)
  const apiKey = opts.apiKey;
  const apiSecret = opts.apiSecret;

  const restBase =
    opts.restBase ?? 'https://data.alpaca.markets/v2';
  const wsUrlDirect =
    opts.wsUrl ?? 'wss://stream.data.alpaca.markets/v2/iex';
  const wsUrlProxy = opts.wsUrl ?? '/ws-proxy'; // if you host a proxy

  // ---------- REST (prefers proxy /api/alpaca/bars if available) ----------
  async function fetchBars(
    symbol: string,
    timeframe = '1Min',
    limit = 500
  ): Promise<Bar[]> {
    // Try proxy first (client-side)
    const tryProxy =
      typeof window !== 'undefined' && (mode === 'proxy' || mode === 'auto');
    if (tryProxy) {
      try {
        const url = `/api/alpaca/bars?symbol=${encodeURIComponent(
          symbol
        )}&timeframe=${encodeURIComponent(
          timeframe
        )}&limit=${encodeURIComponent(String(limit))}`;
        const res = await fetch(url);
        if (res.ok) {
          const payload = await res.json();
          const bars = (payload.bars ?? []).map((b: any) => ({
            t: b.t ?? b.timestamp ?? new Date(b.ts ?? Date.now()).toISOString(),
            o: Number(b.o),
            h: Number(b.h),
            l: Number(b.l),
            c: Number(b.c),
            v: b.v !== undefined ? Number(b.v) : undefined,
          }));
          return bars;
        }
      } catch (err) {
        console.warn('Proxy REST failed:', err);
      }
    }

    // Direct REST (DEV only) - requires keys from opts
    if (!apiKey || !apiSecret)
      throw new Error('Missing Alpaca API keys for direct REST access.');
    const url = `${restBase}/stocks/iex/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });
    if (!res.ok) throw new Error(`Alpaca REST error: ${res.status}`);
    const data = await res.json();
    return (data.bars ?? []).map((b: any) => ({
      t: b.t ?? b.timestamp ?? new Date(b.ts ?? Date.now()).toISOString(),
      o: Number(b.o),
      h: Number(b.h),
      l: Number(b.l),
      c: Number(b.c),
      v: b.v !== undefined ? Number(b.v) : undefined,
    }));
  }

  // Fallback API call using Finnhub if Alpaca returns 404
  async function fetchBarsWithFallback(
    symbol: string,
    timeframe = '1Min',
    limit = 500
  ): Promise<Bar[]> {
    try {
      return await fetchBars(symbol, timeframe, limit);
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        console.warn('Alpaca data not found, falling back to Finnhub for:', symbol);

        const apiKey = 'd4d8prhr01qovljok94gd4d8prhr01qovljok950';

        const resolutionMap: Record<string, string> = {
          '1Min': '1',
          '5Min': '5',
          '15Min': '15',
          '1Hour': '60',
          '1Day': 'D',
        };

        const resolution = resolutionMap[timeframe];
        if (!resolution) throw new Error(`Unsupported timeframe: ${timeframe}`);

        const to = Math.floor(Date.now() / 1000);
        const from = to - limit * 60;

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Finnhub fallback error: ${res.status}`);

        const data = await res.json();
        if (data.s !== 'ok' || !data.t?.length) return [];

        return data.t.map((t: number, i: number) => ({
          t: new Date(t * 1000).toISOString(),
          o: data.o[i],
          h: data.h[i],
          l: data.l[i],
          c: data.c[i],
          v: data.v[i],
        }));
      }

      throw error;
    }
  }

  // ---------- WebSocket (throttled emitter and reconnection) ----------
  let ws: WebSocket | null = null;
  let subscribed = new Set<string>();
  let listeners: ((t: TradeMessage) => void)[] = [];
  let statusCb:
    | ((s: 'connected' | 'reconnecting' | 'disconnected' | 'error') => void)
    | null = null;
  let backoff = 1000;
  let reconnectTimer: number | null = null;
  let latestBySymbol = new Map<string, TradeMessage>();
  let emitIntervalId: number | null = null;
  const preferProxyWs = mode === 'proxy';

  function connectWebsocket() {
    try {
      ws && ws.close();
      ws = new WebSocket(preferProxyWs ? wsUrlProxy : wsUrlDirect);
      statusCb?.('reconnecting');
    } catch (err) {
      statusCb?.('error');
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      if (!preferProxyWs) {
        if (apiKey && apiSecret) {
          ws?.send(
            JSON.stringify({ action: 'auth', key: apiKey, secret: apiSecret })
          );
        } else {
          console.warn('No API key for direct WS; consider using proxy mode');
        }
      }

      if (subscribed.size > 0 && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ action: 'subscribe', trades: Array.from(subscribed) })
        );
      }

      statusCb?.('connected');
      backoff = 1000;

      if (!emitIntervalId) {
        emitIntervalId = window.setInterval(() => {
          if (latestBySymbol.size === 0) return;
          for (const trade of latestBySymbol.values()) {
            listeners.forEach((l) => l(trade));
          }
          latestBySymbol.clear();
        }, Math.max(50, throttleMs));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const m of arr) {
          if (m.T === 't' || m.T === 'trade' || m.type === 'trade') {
            const trade: TradeMessage = {
              T: m.T || 't',
              S: m.S || m.symbol || m.sym,
              p: m.p ?? m.price,
              s: m.s ?? m.size,
              t: m.t ?? m.ts ?? Date.now(),
              ...m,
            };
            if (trade.S) latestBySymbol.set(trade.S, trade);
          }
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    ws.onclose = () => {
      statusCb?.('reconnecting');
      scheduleReconnect();
    };
    ws.onerror = (e) => {
      console.error('WS error', e);
      statusCb?.('error');
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const delay = Math.min(backoff, 30000);
    reconnectTimer = window.setTimeout(() => {
      backoff = Math.floor(backoff * 1.8) + 500;
      connectWebsocket();
    }, delay) as unknown as number;
  }

  function start(opts?: {
    onTrade?: (t: TradeMessage) => void;
    onStatus?: (s: any) => void;
  }) {
    if (opts?.onTrade) listeners.push(opts.onTrade);
    statusCb = opts?.onStatus ?? null;
    connectWebsocket();
  }

  function stop() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (emitIntervalId) clearInterval(emitIntervalId);
    try {
      ws?.close();
    } catch {}
    ws = null;
    subscribed.clear();
    listeners = [];
    statusCb?.('disconnected');
  }

  function subscribe(symbol: string) {
    subscribed.add(symbol);
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'subscribe', trades: [symbol] }));
      }
    } catch {}
  }

  function unsubscribe(symbol: string) {
    subscribed.delete(symbol);
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'unsubscribe', trades: [symbol] }));
      }
    } catch {}
  }

  function addTradeListener(fn: (t: TradeMessage) => void) {
    listeners.push(fn);
  }
  function removeTradeListener(fn: (t: TradeMessage) => void) {
    listeners = listeners.filter((l) => l !== fn);
  }

  // ---------- Derived Indicators (RSI, Volume) ----------
  async function fetchIndicators(symbol: string) {
    const bars = await fetchBars(symbol, '1Min', 500);
    const closes = bars.map((b) => b.c);
    const volumes = bars.map((b) => b.v ?? 0);

    const rsi = calculateRSI(closes, 14);
    const volumeData = calculateVolume(bars);

    return {
      rsi,
      volumeData,
      bars,
    };
  }

  return {
    fetchBars,
    fetchBarsWithFallback,
    fetchIndicators,
    start,
    stop,
    subscribe,
    unsubscribe,
    addTradeListener,
    removeTradeListener,
  };
}
