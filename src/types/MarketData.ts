// src/types/MarketData.ts

// -------------------------------
// CHART TYPES
// -------------------------------
export type ChartType =
  | 'candlestick'
  | 'ohlc'
  | 'line'
  | 'mountain'
  | 'heikin-ashi';

// -------------------------------
// BASIC MARKET STRUCTURES
// -------------------------------
export interface CandleData {
  time: string;        // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source?: 'rest' | 'socket' | 'synthetic'; // useful for debugging or visualizing feed origin
}

export interface Bar {
  t: string;  // time
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

// -------------------------------
// QUOTES & TRADES
// -------------------------------
export interface StockQuote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  exchange?: string;
  updatedAt?: string;  // ISO
  raw?: any;           // raw data from Alpaca stream
}

export interface TradeMessage {
  T: 't';        // type (trade)
  S: string;     // symbol
  p: number;     // price
  s?: number;    // size
  t?: number;    // timestamp epoch ms
  i?: string;    // trade id
  x?: string;    // exchange code
  c?: string[];  // condition codes
  [key: string]: any;
}

export interface QuoteMessage {
  T: 'q';
  S: string;
  bp: number; // bid price
  bs: number; // bid size
  ap: number; // ask price
  as: number; // ask size
  t?: number;
  x?: string;
  [key: string]: any;
}

export interface BarMessage {
  T: 'b';
  S: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
  t?: number;
  [key: string]: any;
}

// -------------------------------
// CONNECTION STATUS & EVENTS
// -------------------------------
export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface MarketEvent {
  type: 'trade' | 'quote' | 'bar' | 'status' | 'error';
  symbol?: string;
  data?: any;
  timestamp: number;
}

// -------------------------------
// INDICATORS
// -------------------------------
export type IndicatorName =
  | 'volume'
  | 'sma'
  | 'ema'
  | 'macd'
  | 'rsi'
  | 'bollinger'
  | 'supertrend'
  | 'atr'
  | 'vwap'
  | 'stochastic'
  | 'adx'
  | 'parabolic';

export interface IndicatorConfig {
  enabled: boolean;
  period?: number;
  [param: string]: any;
}

export type IndicatorsRecord = Record<IndicatorName, IndicatorConfig>;

// -------------------------------
// CHART DATA AGGREGATE
// -------------------------------
export interface ChartData {
  candles: CandleData[];
  indicators: Record<string, any>;
}

// -------------------------------
// BARS CACHE ITEM
// -------------------------------
export interface BarsCacheItem {
  lastFetched: number;
  bars: Bar[];
}
