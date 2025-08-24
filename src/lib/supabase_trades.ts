// src/lib/supabase_trades.ts
import { supabase } from './supabase';

// Matches your "trades" table structure
export type TradeUpsert = {
  id?: string;
  trade_id?: string;
  user_id: string;
  symbol: string;
  side?: 'buy' | 'sell';
  quantity?: number;
  order_type?: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  filled_price?: number;
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  status?: 'open' | 'closed' | 'filled';
  exit_time?: string;
  created_at?: string;
  updated_at?: string;
};

// ✅ Fetch trades for a user
export async function fetchTradesFromSupabase(userId: string): Promise<TradeUpsert[]> {
  const { data, error } = await supabase
    .from('trades') // no generics here
    .select('*')
    .eq('user_id', userId)
    .order('exit_time', { ascending: false });

  if (error) {
    console.error('Error fetching trades:', error);
    return [];
  }

  return (data ?? []) as TradeUpsert[];
}

// ✅ Upsert trades
export async function upsertTrades(trades: TradeUpsert[]): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .upsert(trades, { onConflict: 'id,user_id' });

  if (error) console.error('Error upserting trades:', error);
}

// ✅ Delete a trade
export async function deleteTrade(tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', tradeId);

  if (error) console.error('Error deleting trade:', error);
}
