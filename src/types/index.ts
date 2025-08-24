// src/types/index.ts
export interface Trade {
  id?: string;
  user_id?: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  pnl?: number;
  exit_reason?: string;
  exit_time?: string;
  status?: 'open' | 'closed' | 'filled';
}
