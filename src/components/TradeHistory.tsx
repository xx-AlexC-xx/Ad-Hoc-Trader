// src/components/TradeHistory.tsx
import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppContext';
import { fetchTradesFromSupabase, TradeUpsert as SupabaseTrade } from '@/lib/supabase_trades';
import { updateClosedTrades, Trade as AlpacaTrade } from '@/lib/updateClosedTrades';

interface Trade {
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

// 👇 Define what the parent (Dashboard) can call
export interface TradeHistoryRef {
  fetchTrades: () => void;
}

const TradeHistory = forwardRef<TradeHistoryRef>((props, ref) => {
  const { user } = useAppContext();
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      await updateClosedTrades(user.id);
      const trades: SupabaseTrade[] = await fetchTradesFromSupabase(user.id);

      const transformedTrades: Trade[] = trades.map((t) => ({
        id: t.trade_id || `${t.user_id}-${t.symbol}-${t.exit_time}`,
        user_id: t.user_id,
        symbol: t.symbol,
        entryPrice: t.entry_price || t.filled_price || 0,
        exitPrice: t.exit_price || t.filled_price || 0,
        pnl: t.pnl || 0,
        exit_reason: t.status === 'closed' ? 'closed' : 'manual',
        exit_time: t.exit_time || t.updated_at,
        status: t.status,
      }));

      setClosedTrades(transformedTrades);
    } catch (err: any) {
      setError(err.message || 'Unknown error fetching trades');
      setClosedTrades([]);
    }

    setLoading(false);
  };

  // 👇 Expose fetchTrades to parent (Dashboard)
  useImperativeHandle(ref, () => ({
    fetchTrades,
  }));

  useEffect(() => {
    const timeout = setTimeout(fetchTrades, 1000);
    return () => clearTimeout(timeout);
  }, [user]);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-white">Trade History</CardTitle>
        <button
          className="text-sm text-blue-400 underline hover:text-blue-300"
          onClick={fetchTrades}
        >
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading trade history...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error loading trades: {error}</div>
        ) : closedTrades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No trades completed yet</p>
            <p className="text-sm text-gray-500">Execute trades to see history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Symbol</TableHead>
                  <TableHead className="text-gray-300">Entry</TableHead>
                  <TableHead className="text-gray-300">Exit</TableHead>
                  <TableHead className="text-gray-300">P&L</TableHead>
                  <TableHead className="text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedTrades.map((trade) => {
                  const pnl = trade.pnl ?? 0;
                  return (
                    <TableRow key={trade.id} className="border-gray-700">
                      <TableCell>
                        <Badge className="bg-blue-600">{trade.symbol}</Badge>
                      </TableCell>
                      <TableCell className="text-white">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-white">${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {pnl >= 0 ? '+' : ''}
                        {pnl.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge className={pnl >= 0 ? 'bg-green-600' : 'bg-red-600'}>
                          {trade.exit_reason || 'manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {trade.exit_time ? new Date(trade.exit_time).toLocaleDateString() : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TradeHistory.displayName = 'TradeHistory';
export default TradeHistory;
