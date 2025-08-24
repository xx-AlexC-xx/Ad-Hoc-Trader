// src/types/index.d.ts

export interface TradeUpsert {
  trade_id?: string;
  user_id?: string;
  symbol: string;
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  exit_time?: string;
  status?: string;
  updated_at?: string;
}

export interface Trade {
  id?: string;
  user_id?: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  pnl?: number;
  exit_reason?: string;
  exit_time?: string;
  status?: string;
}
