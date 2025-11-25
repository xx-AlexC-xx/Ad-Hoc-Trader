// src/store/MarketStore.ts
// Full MarketStore for AdHoc_Trader
// - Preserves original inline comments and console.log instrumentation
// - Adds: clearChart, volatility/combinations state, isPoppedOut flag
// - Adds: BroadcastChannel sync for selectors and selectedSymbol
// - Uses createAlpacaClient for real REST + WS (no fake data)
// NOTE: I intentionally left detailed comments and console logs in place per your request.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeCandles, prepareChartData, normalizeCandle } from '@/lib/dataAdapter';
import { createAlpacaClient } from '@/lib/alpacaClient';
import { getUserAlpacaKeys } from '@/lib/alpaca';
import type { ChartType, TradeMessage } from '@/types/MarketData';
import { set } from 'date-fns';

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected' | 'error';

export type IndicatorName =
  | 'volume' | 'sma' | 'ema' | 'macd' | 'rsi' | 'bollinger' | 'supertrend' | 'atr'
  | 'vwap' | 'stochastic' | 'adx' | 'parabolic';

interface BarsCacheItem {
  lastFetched: number;
  bars: CandleData[];
}

interface SymbolChartSettings {
  chartTypes: ChartType[];
  indicators: IndicatorName[];
  volatility: string[];
  combinations: string[];
}

interface MarketState {
  selectedSymbol: string | null;
  candles: CandleData[];
  chartTypes: ChartType[];
  indicators: Record<IndicatorName, any>;
  activeIndicators: IndicatorName[];
  quotes: Record<string, any>;
  barsCache: Record<string, BarsCacheItem>;
  connectionStatus: ConnectionState;
  error: string | null;
  volatility: string[];
  combinations: string[];
  isPoppedOut: boolean;
  watchedSymbols: string[];
  symbolSettings: Record<string, SymbolChartSettings>;
  symbolCandles: Record<string, CandleData[]>;

  addSymbolToWatchList: (symbol: string) => void;
  removeSymbolFromWatchList: (symbol: string) => void;

  setSelectedSymbol: (symbol: string, userId: string) => Promise<void>;
  setChartTypes: (types: ChartType[]) => void;
  setIndicators: (list: IndicatorName[]) => void;
  setConnectionStatus: (s: ConnectionState) => void;

  toggleIndicator: (name: IndicatorName, enabled?: boolean) => void;
  applyPreset: (preset: string) => void;

  setVolatility: (arr: string[]) => void;
  setCombinations: (arr: string[]) => void;
  setPoppedOut: (val: boolean) => void;

  clearChart: (keepSymbol?: boolean) => void;

  fetchHistorical: (
    symbol: string,
    userId: string,
    timeframe?: string,
    limit?: number
  ) => Promise<CandleData[]>;

  loadHistoricalData: (symbol: string, userId: string) => Promise<void>;
  handleLiveUpdate: (data: any) => void;

  startLive: (symbols?: string[], userId?: string) => void;
  subscribeSymbol: (symbol: string) => void;
  unsubscribeSymbol: (symbol: string) => void;
  stopLive: () => void;

  getQuote: (symbol: string) => any;
}

const localId = (Math.random() + 1).toString(36).substring(2, 9);

const DEFAULT_CHART_TYPES: ChartType[] = ['candlestick'];
const DEFAULT_ACTIVE_INDICATORS: IndicatorName[] = ['volume', 'sma'];
const DEFAULT_VOLATILITY: string[] = [];
const DEFAULT_COMBINATIONS: string[] = [];

const cloneDefaultSymbolSettings = (): SymbolChartSettings => ({
  chartTypes: [...DEFAULT_CHART_TYPES],
  indicators: [...DEFAULT_ACTIVE_INDICATORS],
  volatility: [...DEFAULT_VOLATILITY],
  combinations: [...DEFAULT_COMBINATIONS],
});

const cloneSymbolSettings = (settings: SymbolChartSettings): SymbolChartSettings => ({
  chartTypes: [...settings.chartTypes],
  indicators: [...settings.indicators],
  volatility: [...settings.volatility],
  combinations: [...settings.combinations],
});


export const useMarketStore = create<MarketState>()(
  persist((set, get) => {
    const initialState = {
      selectedSymbol: null,
      candles: [] as CandleData[],
      chartTypes: [...DEFAULT_CHART_TYPES] as ChartType[],
      indicators: {
        volume: { enabled: true },
        sma: { enabled: true, period: 20 },
        ema: { enabled: false, period: 20 },
        macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
        rsi: { enabled: false, period: 14 },
        bollinger: { enabled: false, period: 20, dev: 2 },
        supertrend: { enabled: false, period: 10, multiplier: 3 },
        atr: { enabled: false, period: 14 },
        vwap: { enabled: false },
        stochastic: { enabled: false, k: 14, d: 3 },
        adx: { enabled: false, period: 14 },
        parabolic: { enabled: false, step: 0.02, maxStep: 0.2 },
      } as Record<IndicatorName, any>,
      activeIndicators: [...DEFAULT_ACTIVE_INDICATORS] as IndicatorName[],
      quotes: {},
      barsCache: {} as Record<string, BarsCacheItem>,
      connectionStatus: 'disconnected' as ConnectionState,
      error: null,
      volatility: [...DEFAULT_VOLATILITY],
      combinations: [...DEFAULT_COMBINATIONS],
      isPoppedOut: false,
      watchedSymbols: [],
      symbolSettings: {} as Record<string, SymbolChartSettings>,
      symbolCandles: {} as Record<string, CandleData[]>,
      name: 'market-store',
    };

    const store: MarketState = {
      ...initialState,
      addSymbolToWatchList: (symbol: string) => {
        console.log('[MarketStore] addSymbolToWatchList ->', symbol);
        set((state) => ({
          watchedSymbols: [...new Set([...state.watchedSymbols, symbol])],
        }));
      },

      removeSymbolFromWatchList: (symbol: string) => {
        console.log('[MarketStore] removeSymbolFromWatchList ->', symbol);
        set((state) => {
          const symbolSettings = { ...state.symbolSettings };
          delete symbolSettings[symbol];
          const symbolCandles = { ...state.symbolCandles };
          delete symbolCandles[symbol];
          return {
            watchedSymbols: state.watchedSymbols.filter((s) => s !== symbol),
            symbolSettings,
            symbolCandles,
          };
        });
      },

        /**
         * setSelectedSymbol
         * - sets the symbol in store and triggers loadHistoricalData
         */
        setSelectedSymbol: async (symbol: string, userId: string) => {
          console.log('[MarketStore] setSelectedSymbol ->', symbol, 'userId:', userId);
          set((state) => {
            const existing = state.symbolSettings[symbol];
            const resolved = existing ? cloneSymbolSettings(existing) : cloneDefaultSymbolSettings();
            const indicators = { ...state.indicators };
            for (const name of Object.keys(indicators) as IndicatorName[]) {
              indicators[name].enabled = resolved.indicators.includes(name);
            }
            const nextSymbolSettings = existing
              ? state.symbolSettings
              : {
                  ...state.symbolSettings,
                  [symbol]: cloneSymbolSettings(resolved),
                };
            const cachedCandles = state.symbolCandles[symbol];
            return {
              selectedSymbol: symbol,
              chartTypes: [...resolved.chartTypes],
              indicators,
              activeIndicators: [...resolved.indicators],
              volatility: [...resolved.volatility],
              combinations: [...resolved.combinations],
              symbolSettings: nextSymbolSettings,
              candles: cachedCandles ? [...cachedCandles] : state.candles,
            };
          });
          try {
            // load historical bars for the selected symbol
            await get().loadHistoricalData(symbol, userId);
          } catch (err) {
            console.error('[MarketStore] setSelectedSymbol -> loadHistoricalData error', err);
          }
        },

        /**
         * setChartTypes
         * - store accepted chart type array (ChartType[])
         */
        setChartTypes: (arr: ChartType[]) => {
          console.log('[MarketStore] setChartTypes ->', arr);
          set((state) => {
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                chartTypes: [...arr],
              };
            }
            return { chartTypes: arr, symbolSettings };
          });
        },

        /**
         * setIndicators
         * - Accepts a list of IndicatorName values and updates indicators object
         * - Preserves other indicator config fields (periods etc.)
         */
        setIndicators: (list: IndicatorName[]) => {
          console.log('[MarketStore] setIndicators ->', list);
          set((state) => {
            const indicators = { ...state.indicators };
            for (const name of Object.keys(indicators) as IndicatorName[]) {
              indicators[name].enabled = list.includes(name);
            }
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                indicators: [...list],
              };
            }
            return { indicators, activeIndicators: list, symbolSettings };
          });
        },

        /**
         * setConnectionStatus
         * - Updates connection state for UI/diagnostics
         */
        setConnectionStatus: (s: ConnectionState) => {
          console.log('[MarketStore] setConnectionStatus ->', s);
          set({ connectionStatus: s });
        },

        /**
         * toggleIndicator
         * - Flip (or set) enabled for a single indicator
         */
        toggleIndicator: (name: IndicatorName, enabled?: boolean) => {
          console.log('[MarketStore] toggleIndicator ->', name, enabled);
          set((state) => {
            const indicators = {
              ...state.indicators,
              [name]: {
                ...state.indicators[name],
                enabled: enabled ?? !state.indicators[name].enabled,
              },
            };
            const active = new Set(state.activeIndicators);
            const isEnabled = indicators[name].enabled;
            if (isEnabled) active.add(name);
            else active.delete(name);
            const activeArr = Array.from(active) as IndicatorName[];
            console.log('[MarketStore] toggleIndicator -> new activeIndicators', activeArr);
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                indicators: [...activeArr],
              };
            }
            return { indicators, activeIndicators: activeArr, symbolSettings };
          });
        },

        /**
         * applyPreset
         * - Replace current indicator set with a preset list
         */
        applyPreset: (preset: string) => {
          console.log('[MarketStore] applyPreset ->', preset);
          const presets: Record<string, IndicatorName[]> = {
            'Trend Trader': ['ema', 'macd', 'adx', 'volume'],
            'Momentum Reversal': ['rsi', 'stochastic', 'macd', 'volume'],
            'Volatility Breakout': ['bollinger', 'atr', 'supertrend', 'volume'],
            'Institutional Flow': ['vwap', 'volume', 'ema'],
            'Swing Setup': ['sma', 'rsi', 'macd', 'bollinger', 'volume'],
          };
          const list = presets[preset];
          if (!list) {
            console.warn('[MarketStore] applyPreset -> unknown preset', preset);
            return;
          }
          set((state) => {
            const indicators = { ...state.indicators };
            for (const k of Object.keys(indicators) as IndicatorName[]) {
              indicators[k].enabled = list.includes(k);
            }
            console.log('[MarketStore] applyPreset -> applied indicators', list);
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                indicators: [...list],
              };
            }
            return { indicators, activeIndicators: list, symbolSettings };
          });
        },

        /**
         * setVolatility / setCombinations / setPoppedOut
         * - Simple setters for additional selector categories
         */
        setVolatility: (arr: string[]) => {
          console.log('[MarketStore] setVolatility ->', arr);
          set((state) => {
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                volatility: [...arr],
              };
            }
            return { volatility: arr, symbolSettings };
          });
        },
        setCombinations: (arr: string[]) => {
          console.log('[MarketStore] setCombinations ->', arr);
          set((state) => {
            const symbol = state.selectedSymbol;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              const existing = symbolSettings[symbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[symbol] = {
                ...existing,
                combinations: [...arr],
              };
            }
            return { combinations: arr, symbolSettings };
          });
        },
        setPoppedOut: (val: boolean) => {
          console.log('[MarketStore] setPoppedOut ->', val);
          set({ isPoppedOut: val });
        },

        /**
         * clearChart
         * - Resets selectors to sensible defaults while preserving symbol optionally
         * - keepSymbol default true: keep selectedSymbol and current candles; only clear selectors
         */
        clearChart: (keepSymbol = true) => {
          console.log('[MarketStore] clearChart -> keepSymbol=', keepSymbol);
          set((state) => {
            const symbol = keepSymbol ? state.selectedSymbol : null;
            // keep each indicator's config properties (periods, etc.) but reset enabled flags
            const indicators = {
              ...state.indicators,
              // enable only volume by default, disable the rest
              volume: { ...(state.indicators.volume ?? {}), enabled: true },
              sma: { ...(state.indicators.sma ?? {}), enabled: false },
              ema: { ...(state.indicators.ema ?? {}), enabled: false },
              macd: { ...(state.indicators.macd ?? {}), enabled: false },
              rsi: { ...(state.indicators.rsi ?? {}), enabled: false },
              bollinger: { ...(state.indicators.bollinger ?? {}), enabled: false },
              supertrend: { ...(state.indicators.supertrend ?? {}), enabled: false },
              atr: { ...(state.indicators.atr ?? {}), enabled: false },
              vwap: { ...(state.indicators.vwap ?? {}), enabled: false },
              stochastic: { ...(state.indicators.stochastic ?? {}), enabled: false },
              adx: { ...(state.indicators.adx ?? {}), enabled: false },
              parabolic: { ...(state.indicators.parabolic ?? {}), enabled: false },
            } as Record<IndicatorName, any>;
            const symbolSettings = { ...state.symbolSettings };
            if (symbol) {
              symbolSettings[symbol] = {
                chartTypes: [...DEFAULT_CHART_TYPES],
                indicators: ['volume'] as IndicatorName[],
                volatility: [],
                combinations: [],
              };
            }

            return {
              selectedSymbol: symbol,
              candles: keepSymbol ? state.candles : [],
              chartTypes: ['candlestick'] as ChartType[],
              indicators,
              activeIndicators: ['volume'] as IndicatorName[],
              volatility: [],
              combinations: [],
              symbolSettings,
            };
          });
        },

        // --- Data Management: REST (fetchHistorical) and caching ---
        // Updated to require userId and create client on-demand for REST calls
        fetchHistorical: async (symbol: string, userId: string, timeframe = '1Min', limit = 500) => {
          console.log('[MarketStore] fetchHistorical ->', symbol, timeframe, limit, 'userId:', userId);
          const cache = get().barsCache[symbol];
          const now = Date.now();
          if (cache && now - cache.lastFetched < 5 * 60 * 1000) {
            console.log('[MarketStore] fetchHistorical -> serving from cache for', symbol);
            return cache.bars;
          }

          try {
            const keys = await getUserAlpacaKeys(userId);
            if (!keys) {
              throw new Error('No Alpaca keys found for fetchHistorical');
            }
            const tempClient = createAlpacaClient({
              mode: 'direct',
              apiKey: keys.api_key,
              apiSecret: keys.secret_key,
            });

            const bars = await tempClient.fetchBarsWithFallback(symbol, timeframe, limit);
            const normalized = bars.map((b: any) => normalizeCandle(b));
            console.log('[MarketStore] fetchHistorical -> fetched', normalized.length, 'bars for', symbol);

            set((state) => ({
              barsCache: {
                ...state.barsCache,
                [symbol]: { lastFetched: Date.now(), bars: normalized },
              },
            }));
            return normalized;
          } catch (err: any) {
            console.error('[MarketStore] fetchHistorical error ->', err);
            set({ error: err.message || 'Failed to fetch historical data' });
            throw err;
          }
        },

        /**
         * loadHistoricalData
         * - Fetch historical bars then compute any indicator precomputation via prepareChartData,
         *   then set candles and start live feed for that symbol.
         */
        loadHistoricalData: async (symbol: string, userId: string) => {
          console.log('[MarketStore] loadHistoricalData ->', symbol, 'userId:', userId);
          try {
            const candles = await get().fetchHistorical(symbol, userId);
            try {
              // Optional: prepareChartData may compute indicator arrays or cached values
              // Keep this call to maintain compatibility with any external indicator caching logic.
              prepareChartData(candles, get().activeIndicators);
            } catch (err) {
              // If prepareChartData throws, log but continue to set candles
              console.warn('[MarketStore] prepareChartData warning:', err);
            }
            set((state) => ({
              candles,
              symbolCandles: { ...state.symbolCandles, [symbol]: candles },
            }));
            // Start live subscription for the symbol after loading historicals
            get().startLive([symbol], userId);
            set({ connectionStatus: 'connected' });
            console.log('[MarketStore] loadHistoricalData -> done and subscribed to live for', symbol);
          } catch (err) {
            console.error('[MarketStore] loadHistoricalData failed ->', err);
            set({ connectionStatus: 'disconnected' });
          }
        },

        /**
         * handleLiveUpdate
         * - Called when a live trade/tick event is received. Normalize then merge into candles array.
         * - Also triggers any necessary indicator recompute (prepareChartData).
         */
        handleLiveUpdate: (data: any) => {
          // NOTE: data is an object from Alpaca WS; normalizeCandle should accept it
          console.log('[MarketStore] handleLiveUpdate -> received live data', data && data.symbol ? data.symbol : '(unknown)');
          const newCandle = normalizeCandle(data);
          const merged = mergeCandles(get().candles, [newCandle]);
          try {
            prepareChartData(merged, get().activeIndicators);
          } catch (err) {
            console.warn('[MarketStore] prepareChartData during live update warning', err);
          }
          const targetSymbol = (data && data.symbol) || get().selectedSymbol;
          set((state) => ({
            candles: merged,
            symbolCandles: targetSymbol
              ? { ...state.symbolCandles, [targetSymbol]: merged }
              : state.symbolCandles,
          }));
          // Don't forget to update quotes or other derived data if needed (outside scope here)
        },

        // --- Live connection / subscription helpers (WebSocket via Alpaca client) ---
        getQuote: (symbol: string) => {
          // Return last known quote for symbol (used in UI)
          return get().quotes[symbol];
        },

        /**
         * startLive
         * - NOW fetches user keys and creates the Alpaca client on-demand.
         * - Starts Alpaca websocket and registers callbacks.
         */
        startLive: async (symbols?: string[], userId?: string) => {
          console.log('[MarketStore] startLive -> initializing live feed for symbols:', symbols, 'userId:', userId);
          if (!userId) {
            console.error('[MarketStore] startLive -> No userId provided. Cannot initialize Alpaca client.');
            set({ connectionStatus: 'error', error: 'User authentication required.' });
            return;
          }

          set({ connectionStatus: 'reconnecting' });

          // --- NEW: Fetch user keys and create client HERE ---
          let alpacaClient: ReturnType<typeof createAlpacaClient> | null = null;
          try {
            const keys = await getUserAlpacaKeys(userId);
            if (!keys?.api_key || !keys?.secret_key) {
              throw new Error('Alpaca API keys not found for the user.');
            }

            // Create the client with the fetched keys
            alpacaClient = createAlpacaClient({
              mode: 'direct', // or 'proxy' if you have a proxy set up
              apiKey: keys.api_key,
              apiSecret: keys.secret_key,
            });

            // Store the client instance in the state for other actions to use
            (set as any)((state: any) => ({ ...state, _alpacaClient: alpacaClient }));

          } catch (err) {
            console.error('[MarketStore] startLive -> Failed to initialize Alpaca client:', err);
            set({ connectionStatus: 'error', error: 'Failed to load trading credentials.' });
            return;
          }

          // Use the newly created client
          alpacaClient.start({
            onTrade: (trade: TradeMessage) => {
              try {
                // update last-known quote snapshot
                const s = trade.S;
                if (!s) return;
                set((state) => {
                  const prev = state.quotes[s];
                  const price = Number(trade.p);
                  const change = prev ? price - prev.price : 0;
                  const changePercent = prev && prev.price ? (change / prev.price) * 100 : 0;
                  const update = {
                    quotes: {
                      ...state.quotes,
                      [s]: {
                        symbol: s,
                        price,
                        change,
                        changePercent,
                        updatedAt: new Date(trade.t ?? Date.now()).toISOString(),
                        raw: trade,
                      },
                    },
                  };
                  // Emit live update into candles via handleLiveUpdate if appropriate
                  try {
                    get().handleLiveUpdate(trade);
                  } catch (err) {
                    console.warn('[MarketStore] handleLiveUpdate error while processing trade', err);
                  }
                  return update;
                });
              } catch (err) {
                console.error('[MarketStore] startLive -> onTrade handler error', err);
              }
            },
            onStatus: (st) => {
              console.log('[MarketStore] startLive -> status callback:', st);
              if (st === 'connected') set({ connectionStatus: 'connected', error: null });
              else if (st === 'reconnecting') set({ connectionStatus: 'reconnecting' });
              else if (st === 'disconnected') set({ connectionStatus: 'disconnected' });
              else set({ connectionStatus: 'error' });
            },
          });
          
          // If a list of symbols provided, subscribe to them immediately
          if (Array.isArray(symbols)) {
            for (const s of symbols) {
              try {
                alpacaClient.subscribe(s);
                console.log('[MarketStore] startLive -> subscribed to', s);
              } catch (err) {
                console.error('[MarketStore] startLive -> subscribe error for', s, err);
              }
              // ensure quote entry exists
              set((state) => ({
                quotes: {
                  ...state.quotes,
                  [s]: state.quotes[s] ?? { symbol: s, price: 0, updatedAt: new Date().toISOString() },
                },
              }));
            }
          }
        },

        /**
         * subscribeSymbol / unsubscribeSymbol
         * - Wrap alpaca client subscribe/unsubscribe and keep quotes map updated
         */
        subscribeSymbol: (symbol: string) => {
          console.log('[MarketStore] subscribeSymbol ->', symbol);
          const alpacaClient = (get() as any)._alpacaClient;
          if (!alpacaClient) {
            console.warn('[MarketStore] subscribeSymbol -> Alpaca client not initialized.');
            return;
          }
          try {
            alpacaClient.subscribe(symbol);
          } catch (err) {
            console.error('[MarketStore] subscribeSymbol -> alpaca.subscribe error', err);
          }
          set((state) => ({
            quotes: {
              ...state.quotes,
              [symbol]: state.quotes[symbol] ?? { symbol, price: 0, updatedAt: new Date().toISOString() },
            },
          }));
        },

        unsubscribeSymbol: (symbol: string) => {
          console.log('[MarketStore] unsubscribeSymbol ->', symbol);
          const alpacaClient = (get() as any)._alpacaClient;
          if (!alpacaClient) {
            console.warn('[MarketStore] unsubscribeSymbol -> Alpaca client not initialized.');
            return;
          }
          try {
            alpacaClient.unsubscribe(symbol);
            set((state) => {
              const q = { ...state.quotes };
              delete q[symbol];
              return { quotes: q };
            });
          } catch (err) {
            console.error('[MarketStore] unsubscribeSymbol -> error', err);
          }
        },

        stopLive: () => {
          console.log('[MarketStore] stopLive -> stopping alpaca client');
          const alpacaClient = (get() as any)._alpacaClient;
          if (!alpacaClient) {
            console.warn('[MarketStore] stopLive -> Alpaca client not initialized.');
            return;
          }
          try {
            alpacaClient.stop();
            // Clean up the reference
            (set as any)((state: any) => ({ ...state, _alpacaClient: null }));
          } catch (err) {
            console.error('[MarketStore] stopLive -> alpaca.stop error', err);
          }
          set({ connectionStatus: 'disconnected' });
        },
      }; // end store object

      // Return the store object to Zustand
      return store;
    },
    {
      name: 'market-store',
      // Rehydrate/merge behavior left default; keep persisted fields intact
    }
  )
);

// --- New Function: Setup BroadcastChannel Synchronization ---
// This function is defined AFTER useMarketStore to ensure it's initialized
// and addresses the ReferenceError by avoiding premature access.
function setupMarketStoreBroadcastChannelSync() {
  console.log('[MarketStore] setupMarketStoreBroadcastChannelSync -> Attempting to set up BroadcastChannel sync...');
  if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
    try {
      console.log('[MarketStore] setupMarketStoreBroadcastChannelSync -> BroadcastChannel API available. Initializing...');
      const bc = new (window as any).BroadcastChannel('market-ticker');

      console.log('[MarketStore] setupMarketStoreBroadcastChannelSync -> Setting up bc.onmessage handler.');
      bc.onmessage = (ev: MessageEvent) => {
        const msg = ev.data;
        if (!msg) return;
        if (msg.sender === localId) return; // ignore our own messages
        if (msg.type === 'state-update' && msg.payload) {
          const p = msg.payload;
          console.log('[MarketStore] BroadcastChannel -> incoming state-update', p);
          // Apply safely using setState from the already initialized useMarketStore
          if (p.chartTypes && Array.isArray(p.chartTypes)) {
            useMarketStore.setState((state) => {
              const targetSymbol = p.selectedSymbol ?? state.selectedSymbol;
              if (!targetSymbol) return { chartTypes: p.chartTypes };
              const symbolSettings = { ...state.symbolSettings };
              const existing = symbolSettings[targetSymbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[targetSymbol] = {
                ...existing,
                chartTypes: [...p.chartTypes],
              };
              return { chartTypes: p.chartTypes, symbolSettings };
            });
          }
          if (p.activeIndicators && Array.isArray(p.activeIndicators)) {
            useMarketStore.setState((state) => {
              const indicators = { ...state.indicators };
              for (const k of Object.keys(indicators) as IndicatorName[]) {
                indicators[k].enabled = p.activeIndicators.includes(k);
              }
              const targetSymbol = p.selectedSymbol ?? state.selectedSymbol;
              if (!targetSymbol) {
                return { indicators, activeIndicators: p.activeIndicators };
              }
              const symbolSettings = { ...state.symbolSettings };
              const existing = symbolSettings[targetSymbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[targetSymbol] = {
                ...existing,
                indicators: [...p.activeIndicators],
              };
              return { indicators, activeIndicators: p.activeIndicators, symbolSettings };
            });
          }
          if (p.volatility && Array.isArray(p.volatility)) {
            useMarketStore.setState((state) => {
              const targetSymbol = p.selectedSymbol ?? state.selectedSymbol;
              if (!targetSymbol) return { volatility: p.volatility };
              const symbolSettings = { ...state.symbolSettings };
              const existing = symbolSettings[targetSymbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[targetSymbol] = {
                ...existing,
                volatility: [...p.volatility],
              };
              return { volatility: p.volatility, symbolSettings };
            });
          }
          if (p.combinations && Array.isArray(p.combinations)) {
            useMarketStore.setState((state) => {
              const targetSymbol = p.selectedSymbol ?? state.selectedSymbol;
              if (!targetSymbol) return { combinations: p.combinations };
              const symbolSettings = { ...state.symbolSettings };
              const existing = symbolSettings[targetSymbol] ?? cloneDefaultSymbolSettings();
              symbolSettings[targetSymbol] = {
                ...existing,
                combinations: [...p.combinations],
              };
              return { combinations: p.combinations, symbolSettings };
            });
          }
          if (p.selectedSymbol) {
            // set selectedSymbol but do not auto-load historicals unless caller requests
            useMarketStore.setState({ selectedSymbol: p.selectedSymbol });
          }
        }
      };

      // Broadcast store slices on local changes (throttled)
      let lastBroadcast = 0;
      console.log('[MarketStore] setupMarketStoreBroadcastChannelSync -> Subscribing to useMarketStore changes for broadcasting.');
      (useMarketStore as any).subscribe( // useMarketStore is now fully defined here
        (s: any) => ({
          chartTypes: s.chartTypes,
          activeIndicators: s.activeIndicators,
          volatility: s.volatility,
          combinations: s.combinations,
          selectedSymbol: s.selectedSymbol,
        }),
        (stateSlice: any) => {
          // throttle to ~200ms
          const now = Date.now();
          if (now - lastBroadcast < 200) return;
          lastBroadcast = now;
          try {
            console.log('[MarketStore] BroadcastChannel -> Sending state-update via postMessage.', stateSlice);
            bc.postMessage({ sender: localId, type: 'state-update', payload: stateSlice });
          } catch (err) {
            console.warn('[MarketStore] BroadcastChannel postMessage failed', err);
          }
        }
      );
      console.log('[MarketStore] setupMarketStoreBroadcastChannelSync -> BroadcastChannel sync setup complete.');
    } catch (err) {
      console.error('[MarketStore] setupMarketStoreBroadcastChannelSync -> BroadcastChannel setup failed catastrophically!', err);
    }
  } else {
    console.warn('[MarketStore] setupMarketStoreBroadcastChannelSync -> BroadcastChannel API not available in this environment.');
  }
}

// Immediately call the setup function after the store is defined
setupMarketStoreBroadcastChannelSync();
