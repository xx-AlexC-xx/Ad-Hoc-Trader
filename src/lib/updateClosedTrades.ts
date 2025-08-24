// src/lib/updateClosedTrades.ts
import { supabase } from '@/lib/supabase';
import { getUserAlpacaKeys, getAlpacaPositions } from '@/lib/alpaca';

export interface Trade {
  trade_id: string;   // ✅ unique per trade
  user_id: string;
  symbol: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  exit_reason: string;
  exit_time: string;
  status: string;
}

interface AlpacaPosition {
  symbol: string;
  qty: number;
  avg_entry_price: string;
  unrealized_pl: string;
  realized_pl: string;
  status?: string; // e.g., 'open' or 'closed'
  close_time?: string; // optional, if available
}

// Return Promise<Trade[]> so caller can assign it
export const updateClosedTrades = async (userId: string): Promise<Trade[]> => {
  try {
    // Get Alpaca keys
    const keys = await getUserAlpacaKeys(userId);
    if (!keys) {
      console.log('No Alpaca keys for user', userId);
      return [];
    }

    // Fetch current positions
    const positions: AlpacaPosition[] = await getAlpacaPositions(
      keys.api_key,
      keys.secret_key
    );

    // Filter closed trades (qty === 0)
    const closedTrades = positions.filter((pos) => Number(pos.qty) === 0);

    if (closedTrades.length === 0) {
      console.log('No closed trades found to upsert.');
      return [];
    }

    // Transform closed trades into the shape Supabase expects
    const tradesToUpsert: Trade[] = closedTrades.map((trade) => {
      const exitPrice =
        parseFloat(trade.avg_entry_price) + parseFloat(trade.realized_pl);
      const pnl = parseFloat(trade.realized_pl);

      // ✅ unique trade_id ensures no overwriting of multiple trades per symbol
      const tradeId = `${userId}-${trade.symbol}-${trade.close_time || Date.now()}`;

      return {
        trade_id: tradeId,
        user_id: userId,
        symbol: trade.symbol,
        entry_price: parseFloat(trade.avg_entry_price),
        exit_price: exitPrice,
        pnl: pnl,
        exit_reason: 'closed',
        exit_time: trade.close_time || new Date().toISOString(),
        status: 'closed',
      };
    });

    // Upsert trades directly using Supabase
    const chunkSize = 100; // optional chunking
    for (let i = 0; i < tradesToUpsert.length; i += chunkSize) {
      const chunk = tradesToUpsert.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('trades')
        .upsert(chunk, { onConflict: 'trade_id' }); // ✅ fixed

      if (error) {
        console.error('Failed to upsert trades chunk:', error.message);
      } else {
        console.log(`Upserted trades chunk ${i / chunkSize + 1}`);
      }
    }

    console.log(`✅ Upserted ${tradesToUpsert.length} closed trades for user ${userId}`);
    return tradesToUpsert; // return trades array
  } catch (err) {
    console.error('Error updating closed trades:', err);
    return [];
  }
};
